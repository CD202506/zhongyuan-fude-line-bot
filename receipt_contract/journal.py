"""Independent Legacy journal: synthetic SQLite reference, NOT Render disk binding."""

import sqlite3
import time
import uuid
from contextlib import contextmanager

from .contract import ContractError


class LegacyJournal:
    def __init__(self, path):
        self.path = str(path)
        if self.path == ":memory:":
            raise ValueError("durable_path_required")
        with self.db() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS owners (
                    event_key TEXT PRIMARY KEY, message_key TEXT UNIQUE,
                    fingerprint TEXT NOT NULL, owner TEXT NOT NULL,
                    state TEXT NOT NULL, lease TEXT, lease_until REAL,
                    receipt_id TEXT
                );
                CREATE TABLE IF NOT EXISTS event_aliases (
                    event_key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL,
                    owner_key TEXT NOT NULL REFERENCES owners(event_key)
                );
                CREATE TABLE IF NOT EXISTS effects (
                    owner_key TEXT NOT NULL REFERENCES owners(event_key),
                    operation TEXT NOT NULL, state TEXT NOT NULL,
                    PRIMARY KEY(owner_key,operation)
                );
                CREATE TABLE IF NOT EXISTS resolutions (
                    id TEXT PRIMARY KEY, owner_key TEXT NOT NULL,
                    actor_reference TEXT NOT NULL, evidence_reference TEXT NOT NULL,
                    decision TEXT NOT NULL, resolved_at REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS control (
                    id INTEGER PRIMARY KEY CHECK(id=1), enabled INTEGER NOT NULL,
                    outbound_paused INTEGER NOT NULL, generation INTEGER NOT NULL
                );
                INSERT OR IGNORE INTO control VALUES(1,0,1,0);
            """)
            columns = {r[1] for r in db.execute("PRAGMA table_info(owners)")}
            if "received_at" not in columns:
                db.execute("ALTER TABLE owners ADD COLUMN received_at REAL NOT NULL DEFAULT 0")
            if "reason" not in columns:
                db.execute("ALTER TABLE owners ADD COLUMN reason TEXT")

    @contextmanager
    def db(self):
        db = sqlite3.connect(self.path, timeout=5)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        db.execute("PRAGMA synchronous=FULL")
        try:
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    def metrics(self):
        now = time.time()
        with self.db() as db:
            counts = {r[0]: r[1] for r in db.execute("SELECT state,count(*) FROM owners WHERE owner='v2' GROUP BY state")}
            oldest = db.execute("SELECT min(received_at) FROM owners WHERE owner='v2' AND state<>'durably_accepted'").fetchone()[0]
            return {"states": counts,
                "auth_failures": db.execute("SELECT count(*) FROM owners WHERE reason='auth_rejected' AND state<>'durably_accepted'").fetchone()[0],
                "stuck": db.execute("SELECT count(*) FROM owners WHERE state='claimed' AND lease_until<=?", (now,)).fetchone()[0],
                "backlog_age": max(0, now-oldest) if oldest is not None else 0}

    def auth_failed(self, key):
        with self.db() as db:
            db.execute("UPDATE owners SET reason='auth_rejected' WHERE event_key=?", (key,))

    def set_enabled(self, enabled):
        with self.db() as db:
            db.execute(
                "UPDATE control SET enabled=?,outbound_paused=1,generation=generation+1 WHERE id=1",
                (int(enabled),),
            )

    def paused(self):
        with self.db() as db:
            return bool(
                db.execute("SELECT outbound_paused FROM control WHERE id=1").fetchone()[
                    0
                ]
            )

    def resume_outbound(self, expected_generation):
        with self.db() as db:
            changed = db.execute(
                "UPDATE control SET outbound_paused=0 WHERE id=1 AND enabled=1 AND generation=?",
                (expected_generation,),
            ).rowcount
            if not changed:
                raise ContractError("stale_control_generation")

    def reserve(self, item, candidate):
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            alias = db.execute(
                "SELECT * FROM event_aliases WHERE event_key=?", (item["event_key"],)
            ).fetchone()
            if alias:
                if alias["fingerprint"] != item["event_fingerprint"]:
                    raise ContractError("legacy_event_conflict")
                return dict(
                    db.execute(
                        "SELECT * FROM owners WHERE event_key=?", (alias["owner_key"],)
                    ).fetchone()
                )
            row = db.execute(
                "SELECT * FROM owners WHERE message_key=?", (item["message_key"],)
            ).fetchone()
            if row and row["fingerprint"] != item["fingerprint"]:
                raise ContractError("legacy_message_conflict")
            if row is None:
                enabled = db.execute(
                    "SELECT enabled FROM control WHERE id=1"
                ).fetchone()[0]
                owner = "v2" if enabled and candidate else "v1"
                db.execute(
                    "INSERT INTO owners(event_key,message_key,fingerprint,owner,state,received_at) VALUES(?,?,?,?,?,?)",
                    (
                        item["event_key"],
                        item["message_key"],
                        item["fingerprint"],
                        owner,
                        "reserved",
                        time.time(),
                    ),
                )
                row = db.execute(
                    "SELECT * FROM owners WHERE event_key=?", (item["event_key"],)
                ).fetchone()
            db.execute(
                "INSERT INTO event_aliases VALUES(?,?,?)",
                (item["event_key"], item["event_fingerprint"], row["event_key"]),
            )
            return dict(row)

    def relay_attempt(self, key):
        # Commit before network I/O. A crash in flight is an unknown outcome.
        with self.db() as db:
            changed = db.execute(
                "UPDATE owners SET state='relay_attempted' "
                "WHERE event_key=? AND owner='v2' AND state IN "
                "('reserved','relay_attempted','unknown_outcome')",
                (key,),
            ).rowcount
            if not changed:
                raise ContractError("relay_attempt_not_allowed")

    def relay_unknown(self, key):
        with self.db() as db:
            db.execute(
                "UPDATE owners SET state='unknown_outcome' "
                "WHERE event_key=? AND owner='v2' AND state='relay_attempted'",
                (key,),
            )

    def inspect(self, key):
        # Pseudonymous metadata only; no payload or provider user identity.
        with self.db() as db:
            row = db.execute(
                "SELECT owner,state,receipt_id FROM owners WHERE event_key=?", (key,)
            ).fetchone()
            if not row:
                raise ContractError("journal_not_found", 404)
            result = dict(row)
            if result["state"] == "relay_attempted":
                result["recovery"] = "unknown_until_same_key_receipt_reconciled"
            return result

    def accepted(self, key, receipt_id):
        with self.db() as db:
            db.execute(
                "UPDATE owners SET state='durably_accepted',receipt_id=? WHERE event_key=? AND owner='v2'",
                (receipt_id, key),
            )

    def claim(self, key, now):
        lease = uuid.uuid4().hex
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT * FROM owners WHERE event_key=? AND owner='v1'", (key,)
            ).fetchone()
            if not row:
                raise ContractError("wrong_owner")
            if row["state"] == "claimed" and row["lease_until"] <= now:
                # Never reclaim a worker which may have performed an external side effect.
                db.execute(
                    "UPDATE owners SET state='unknown_outcome',lease=NULL WHERE event_key=?",
                    (key,),
                )
                return "unknown_outcome", None
            if row["state"] != "reserved":
                return row["state"], None
            db.execute(
                "UPDATE owners SET state='claimed',lease=?,lease_until=? WHERE event_key=?",
                (lease, now + 30, key),
            )
            return "claimed", lease

    def effect(self, key, lease, operation, state):
        if operation not in {"line_reply", "line_query_logs"} or state not in {
            "started",
            "confirmed",
            "unknown_outcome",
        }:
            raise ContractError("invalid_effect")
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT state,lease FROM owners WHERE event_key=?", (key,)
            ).fetchone()
            if not row or row["state"] != "claimed" or row["lease"] != lease:
                raise ContractError("stale_legacy_claim")
            prior = db.execute(
                "SELECT state FROM effects WHERE owner_key=? AND operation=?",
                (key, operation),
            ).fetchone()
            if state == "started":
                if prior:
                    raise ContractError("effect_already_attempted")
                db.execute("INSERT INTO effects VALUES(?,?,?)", (key, operation, state))
            elif not prior or prior[0] != "started":
                raise ContractError("invalid_effect_transition")
            else:
                db.execute(
                    "UPDATE effects SET state=? WHERE owner_key=? AND operation=?",
                    (state, key, operation),
                )

    def finish(self, key, lease, success):
        with self.db() as db:
            changed = db.execute(
                "UPDATE owners SET state=?,lease=NULL WHERE event_key=? AND lease=? AND state='claimed'",
                ("completed" if success else "unknown_outcome", key, lease),
            ).rowcount
            if not changed:
                raise ContractError("stale_legacy_claim")

    def resolve(self, key, actor, evidence, now):
        """Operator-only injected port. ACK/close after verified completion or accepted loss.

        Never resets attempts; no automatic resend/reappend or new canonical Message.
        Authentication belongs to a future operator adapter, not a public route.
        """
        import re

        if not all(
            isinstance(v, str) and re.fullmatch(r"[a-f0-9]{64}", v)
            for v in (actor, evidence)
        ):
            raise ContractError("resolution_evidence_required")
        with self.db() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT state FROM owners WHERE event_key=? AND owner='v1'", (key,)
            ).fetchone()
            if not row or row[0] != "unknown_outcome":
                raise ContractError("resolution_not_allowed")
            db.execute(
                "INSERT INTO resolutions VALUES(?,?,?,?,?,?)",
                (
                    uuid.uuid4().hex,
                    key,
                    actor,
                    evidence,
                    "reviewed_close_no_resend",
                    now,
                ),
            )
            db.execute("UPDATE owners SET state='completed' WHERE event_key=?", (key,))


class EffectTracker:
    def __init__(self, journal, key, lease):
        self.journal, self.key, self.lease = journal, key, lease

    def log_reference(self):
        import hashlib

        return (
            "LQ-"
            + hashlib.sha256((self.key + ":line_query_logs").encode()).hexdigest()[:24]
        )

    def begin(self, operation):
        self.journal.effect(self.key, self.lease, operation, "started")

    def confirmed(self, operation):
        self.journal.effect(self.key, self.lease, operation, "confirmed")

    def unknown(self, operation):
        self.journal.effect(self.key, self.lease, operation, "unknown_outcome")
