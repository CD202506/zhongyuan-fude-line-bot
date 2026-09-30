"""Durable metadata-only relay journal. Construct explicitly at runtime."""

import hashlib
import sqlite3
import time
import uuid
from contextlib import contextmanager
from pathlib import Path


class JournalError(Exception):
    pass


class RelayJournal:
    def __init__(self, path, clock=time.time):
        self.path, self.clock = Path(path), clock
        if str(path) == ":memory:":
            raise JournalError("persistent_path_required")
        with self.db() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS relay_jobs (
                    key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL,
                    state TEXT NOT NULL, received REAL NOT NULL, updated REAL NOT NULL,
                    attempts INTEGER NOT NULL DEFAULT 0, lease TEXT, lease_until REAL,
                    receipt_id TEXT, reason TEXT, resolved INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS relay_aliases (event_key TEXT PRIMARY KEY, key TEXT NOT NULL, fingerprint TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS relay_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, key TEXT NOT NULL,
                    state TEXT NOT NULL, recorded REAL NOT NULL, reason TEXT,
                    actor TEXT, evidence TEXT
                );
            """)
            if db.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                raise JournalError("journal_integrity_failed")

    @contextmanager
    def db(self):
        db = sqlite3.connect(str(self.path), timeout=0.25)
        db.row_factory = sqlite3.Row
        try:
            db.execute("PRAGMA synchronous=FULL")
            db.execute("BEGIN IMMEDIATE")
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def _history(self, db, key, state, reason=None, actor=None, evidence=None):
        db.execute(
            "INSERT INTO relay_history(key,state,recorded,reason,actor,evidence) VALUES(?,?,?,?,?,?)",
            (key, state, self.clock(), reason, actor, evidence),
        )

    def receive(self, event):
        # No event text, source identity, credential or provider token is persisted.
        key = hashlib.sha256(
            (
                event.organization
                + ":"
                + event.channel
                + ":"
                + event.provider
                + ":"
                + (event.message_reference or event.event_reference)
            ).encode()
        ).hexdigest()
        fingerprint = event.fingerprint(message=bool(event.message_reference))
        event_key = hashlib.sha256(
            (
                event.organization
                + ":"
                + event.channel
                + ":"
                + event.provider
                + ":"
                + event.event_reference
            ).encode()
        ).hexdigest()
        with self.db() as db:
            alias = db.execute(
                "SELECT key,fingerprint FROM relay_aliases WHERE event_key=?",
                (event_key,),
            ).fetchone()
            if alias and (
                alias["key"] != key or alias["fingerprint"] != event.fingerprint()
            ):
                raise JournalError("journal_event_conflict")
            row = db.execute("SELECT * FROM relay_jobs WHERE key=?", (key,)).fetchone()
            if row:
                if row["fingerprint"] != fingerprint:
                    raise JournalError("journal_identity_conflict")
                db.execute(
                    "INSERT OR IGNORE INTO relay_aliases VALUES(?,?,?)",
                    (event_key, key, event.fingerprint()),
                )
                return key
            db.execute(
                "INSERT INTO relay_jobs(key,fingerprint,state,received,updated) VALUES(?,?,?,?,?)",
                (key, fingerprint, "received", self.clock(), self.clock()),
            )
            db.execute(
                "INSERT INTO relay_aliases VALUES(?,?,?)",
                (event_key, key, event.fingerprint()),
            )
            self._history(db, key, "received")
        return key

    def inspect(self, key):
        with self.db() as db:
            row = db.execute("SELECT * FROM relay_jobs WHERE key=?", (key,)).fetchone()
            if not row:
                raise JournalError("journal_not_found")
            return dict(row)

    def claim(self, key):
        with self.db() as db:
            row = db.execute("SELECT * FROM relay_jobs WHERE key=?", (key,)).fetchone()
            if (
                not row
                or row["resolved"]
                or row["state"] not in {"received", "retryable_failure"}
            ):
                return None
            if row["attempts"] >= 5:
                db.execute(
                    "UPDATE relay_jobs SET state='terminal_failure',updated=?,reason='retry_exhausted' WHERE key=?",
                    (self.clock(), key),
                )
                self._history(db, key, "terminal_failure", "retry_exhausted")
                return None
            lease = uuid.uuid4().hex
            db.execute(
                "UPDATE relay_jobs SET state='attempted',attempts=attempts+1,lease=?,lease_until=?,updated=? WHERE key=?",
                (lease, self.clock() + 10, self.clock(), key),
            )
            self._history(db, key, "attempted")
            return lease

    def finish(self, key, lease, state, receipt_id=None, reason=None):
        if state not in {
            "durable_accepted",
            "unknown_outcome",
            "retryable_failure",
            "terminal_failure",
        }:
            raise JournalError("invalid_transition")
        if state == "durable_accepted":
            receipt_id = str(uuid.UUID(receipt_id))
        if reason not in {
            None,
            "auth_rejected",
            "timeout",
            "unavailable",
            "transport_unknown",
            "invalid_response",
        }:
            raise JournalError("invalid_reason")
        with self.db() as db:
            changed = db.execute(
                "UPDATE relay_jobs SET state=?,receipt_id=?,reason=?,lease=NULL,lease_until=NULL,updated=? WHERE key=? AND state='attempted' AND lease=?",
                (state, receipt_id, reason, self.clock(), key, lease),
            ).rowcount
            if changed != 1:
                raise JournalError("stale_attempt")
            self._history(db, key, state, reason)

    def operate(self, key, action, actor, evidence):
        import re

        if not all(
            isinstance(v, str) and re.fullmatch(r"[a-f0-9]{64}", v)
            for v in (actor, evidence)
        ):
            raise JournalError("operator_evidence_required")
        with self.db() as db:
            row = db.execute("SELECT * FROM relay_jobs WHERE key=?", (key,)).fetchone()
            if not row or row["resolved"]:
                raise JournalError("operator_state_denied")
            if action == "reclaim":
                if row["state"] != "attempted" or row["lease_until"] > self.clock():
                    raise JournalError("lease_not_expired")
                state = "unknown_outcome"  # An expired attempt may have reached the receiver.
            elif action == "retry":
                if row["state"] != "retryable_failure":
                    raise JournalError("unsafe_retry")
                state = "retryable_failure"
            elif action == "resolve":
                if row["state"] not in {
                    "unknown_outcome",
                    "terminal_failure",
                    "durable_accepted",
                }:
                    raise JournalError("unsafe_resolution")
                state = "resolved"
            else:
                raise JournalError("invalid_action")
            db.execute(
                "UPDATE relay_jobs SET state=?,resolved=?,lease=NULL,lease_until=NULL,updated=? WHERE key=?",
                (state, int(state == "resolved"), self.clock(), key),
            )
            self._history(db, key, state, action, actor, evidence)

    def metrics(self):
        with self.db() as db:
            counts = {
                r[0]: r[1]
                for r in db.execute(
                    "SELECT state,count(*) FROM relay_jobs WHERE resolved=0 GROUP BY state"
                )
            }
            stuck = db.execute(
                "SELECT count(*) FROM relay_jobs WHERE resolved=0 AND state='attempted' AND lease_until<=?",
                (self.clock(),),
            ).fetchone()[0]
            oldest = db.execute(
                "SELECT min(received) FROM relay_jobs WHERE resolved=0 AND state IN ('received','retryable_failure','attempted')"
            ).fetchone()[0]
            return {
                "states": counts,
                "auth_failures": db.execute(
                    "SELECT count(*) FROM relay_jobs WHERE resolved=0 AND reason='auth_rejected'"
                ).fetchone()[0],
                "stuck": stuck,
                "backlog_age": 0 if oldest is None else max(0, self.clock() - oldest),
            }
