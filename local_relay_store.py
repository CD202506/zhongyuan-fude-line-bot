"""Local-only restart proof. NOT a Render storage adapter or deployable queue.

Only synthetic data belongs here. Construction is explicit; main never creates it.
No raw webhook, reply token, provider user ID or credential is persisted.
"""

import json
import sqlite3
import uuid
from contextlib import contextmanager
from pathlib import Path

from webhook_security import IngressError


class LocalReceiptStore:
    def __init__(self, path: str | Path):
        self.path = str(path)
        if self.path == ":memory:":
            raise ValueError("restart_proof_requires_file")
        with self.connection() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS receipts (
                    receipt TEXT PRIMARY KEY,
                    message_key TEXT UNIQUE,
                    fingerprint TEXT NOT NULL,
                    route TEXT NOT NULL,
                    state TEXT NOT NULL,
                    payload TEXT,
                    attempts INTEGER NOT NULL DEFAULT 0,
                    due REAL NOT NULL DEFAULT 0,
                    lease TEXT,
                    lease_until REAL,
                    created REAL NOT NULL
                );
                CREATE TABLE IF NOT EXISTS aliases (
                    event_key TEXT PRIMARY KEY,
                    fingerprint TEXT NOT NULL,
                    receipt TEXT NOT NULL REFERENCES receipts(receipt)
                );
            """)

    @contextmanager
    def connection(self):
        db = sqlite3.connect(self.path, timeout=0.25)
        db.row_factory = sqlite3.Row
        try:
            db.execute("PRAGMA foreign_keys=ON")
            db.execute("PRAGMA synchronous=FULL")
            yield db
        finally:
            db.close()

    def prepare_batch(self, items: list[dict], now: float) -> list[dict]:
        """All receipts/outbox entries commit before any legacy side effect."""
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            try:
                result = []
                for item in items:
                    alias = db.execute(
                        "SELECT * FROM aliases WHERE event_key=?", (item["event_key"],)
                    ).fetchone()
                    if alias:
                        if alias["fingerprint"] != item["event_fingerprint"]:
                            raise IngressError(409, "event_conflict")
                        row = db.execute(
                            "SELECT * FROM receipts WHERE receipt=?",
                            (alias["receipt"],),
                        ).fetchone()
                    else:
                        row = None
                        if item["message_key"]:
                            row = db.execute(
                                "SELECT * FROM receipts WHERE message_key=?",
                                (item["message_key"],),
                            ).fetchone()
                        if row and row["fingerprint"] != item["fingerprint"]:
                            raise IngressError(409, "message_conflict")
                        if row is None:
                            receipt = item["event_key"]
                            payload = item["envelope"]
                            if payload is not None:
                                payload = dict(payload, relay_id=receipt)
                            db.execute(
                                "INSERT INTO receipts "
                                "(receipt,message_key,fingerprint,route,state,payload,created) "
                                "VALUES (?,?,?,?,?,?,?)",
                                (
                                    receipt,
                                    item["message_key"],
                                    item["fingerprint"],
                                    item["route"],
                                    "pending" if item["route"] != "ignored" else "done",
                                    json.dumps(payload, ensure_ascii=False)
                                    if payload
                                    else None,
                                    now,
                                ),
                            )
                            row = db.execute(
                                "SELECT * FROM receipts WHERE receipt=?", (receipt,)
                            ).fetchone()
                        db.execute(
                            "INSERT INTO aliases VALUES (?,?,?)",
                            (
                                item["event_key"],
                                item["event_fingerprint"],
                                row["receipt"],
                            ),
                        )
                    result.append(dict(row))
                db.commit()
                return result
            except BaseException:
                db.rollback()
                raise

    def begin_legacy(self, receipt: str) -> str:
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            row = db.execute(
                "SELECT state FROM receipts WHERE receipt=?", (receipt,)
            ).fetchone()
            if row["state"] == "pending":
                db.execute(
                    "UPDATE receipts SET state='processing' WHERE receipt=?", (receipt,)
                )
            db.commit()
            return row["state"]

    def finish_legacy(self, receipt: str, state: str) -> None:
        if state not in {"done", "unknown"}:
            raise ValueError("invalid_state")
        with self.connection() as db:
            db.execute(
                "UPDATE receipts SET state=? WHERE receipt=? AND state='processing'",
                (state, receipt),
            )
            db.commit()

    def claim(self, now: float) -> dict | None:
        with self.connection() as db:
            db.execute("BEGIN IMMEDIATE")
            # Exhaustion never means silently deleting a failed event.
            db.execute(
                "UPDATE receipts SET state='blocked',lease=NULL "
                "WHERE route='pilot' AND state IN ('pending','sending') "
                "AND (state='pending' OR lease_until<=?) "
                "AND (attempts>=5 OR created<=?)",
                (now, now - 86400),
            )
            row = db.execute(
                "SELECT * FROM receipts WHERE route='pilot' AND "
                "((state='pending' AND due<=?) OR (state='sending' AND lease_until<=?)) "
                "ORDER BY created,receipt LIMIT 1",
                (now, now),
            ).fetchone()
            if row is None:
                db.commit()
                return None
            lease = uuid.uuid4().hex
            db.execute(
                "UPDATE receipts SET state='sending',lease=?,lease_until=?,"
                "attempts=attempts+1 WHERE receipt=?",
                (lease, now + 30, row["receipt"]),
            )
            db.commit()
            return dict(row, lease=lease, attempts=row["attempts"] + 1)

    def complete(self, job: dict, accepted: bool, now: float) -> bool:
        with self.connection() as db:
            if accepted:
                changed = db.execute(
                    "UPDATE receipts SET state='done',payload=NULL,lease=NULL "
                    "WHERE receipt=? AND lease=? AND state='sending'",
                    (job["receipt"], job["lease"]),
                ).rowcount
            else:
                changed = db.execute(
                    "UPDATE receipts SET state=?,due=?,lease=NULL WHERE receipt=? "
                    "AND lease=? AND state='sending'",
                    (
                        "blocked" if job["attempts"] >= 5 else "pending",
                        now + min(60, 2 ** job["attempts"]),
                        job["receipt"],
                        job["lease"],
                    ),
                ).rowcount
            db.commit()
            return bool(changed)

    def inventory(self) -> list[dict]:
        """Metadata only, used by local tests; never exposes envelope text."""
        with self.connection() as db:
            return [
                dict(row)
                for row in db.execute(
                    "SELECT receipt,route,state,attempts,created FROM receipts ORDER BY created,receipt"
                )
            ]
