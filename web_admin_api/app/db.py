import json
import sqlite3
from collections.abc import Iterable
from pathlib import Path
from typing import Any

from .config import get_settings


def get_database_url() -> str | None:
    return get_settings().database_url


def database_configured() -> bool:
    return bool(get_database_url())


def get_database_mode() -> str:
    return "postgresql" if get_database_url() else "sqlite"


def postgresql_crud_ready() -> bool:
    return False


def ensure_sqlite_runtime() -> None:
    if get_database_url():
        raise RuntimeError("PostgreSQL CRUD runtime is planned for A20. Run migrations first, then enable PostgreSQL CRUD in a later step.")


def get_local_sqlite_path() -> Path:
    return get_settings().local_sqlite_path


def get_sqlite_connection() -> sqlite3.Connection:
    ensure_sqlite_runtime()
    db_path = get_local_sqlite_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    return connection


def encode_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def decode_json(value: str | None, fallback: Any) -> Any:
    if not value:
        return fallback
    return json.loads(value)


def execute_script(statements: str) -> None:
    with get_sqlite_connection() as connection:
        connection.executescript(statements)


def execute(query: str, params: Iterable[Any] = ()) -> sqlite3.Cursor:
    with get_sqlite_connection() as connection:
        cursor = connection.execute(query, tuple(params))
        connection.commit()
        return cursor


def fetch_one(query: str, params: Iterable[Any] = ()) -> sqlite3.Row | None:
    with get_sqlite_connection() as connection:
        return connection.execute(query, tuple(params)).fetchone()


def fetch_all(query: str, params: Iterable[Any] = ()) -> list[sqlite3.Row]:
    with get_sqlite_connection() as connection:
        return list(connection.execute(query, tuple(params)).fetchall())


def init_local_database(seed: bool = False) -> None:
    statements = """
    CREATE TABLE IF NOT EXISTS web_admin_records (
        id TEXT PRIMARY KEY,
        module_key TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'active',
        record_date TEXT,
        due_date TEXT,
        responsible TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT '',
        fields_json TEXT NOT NULL DEFAULT '{}',
        tags_json TEXT NOT NULL DEFAULT '[]',
        is_archived INTEGER NOT NULL DEFAULT 0,
        archived_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by TEXT NOT NULL DEFAULT '',
        updated_by TEXT NOT NULL DEFAULT ''
    );

    CREATE INDEX IF NOT EXISTS idx_web_admin_records_module_key
        ON web_admin_records (module_key);
    CREATE INDEX IF NOT EXISTS idx_web_admin_records_status
        ON web_admin_records (status);
    CREATE INDEX IF NOT EXISTS idx_web_admin_records_is_archived
        ON web_admin_records (is_archived);
    CREATE INDEX IF NOT EXISTS idx_web_admin_records_record_date
        ON web_admin_records (record_date);

    CREATE TABLE IF NOT EXISTS web_admin_audit_events (
        id TEXT PRIMARY KEY,
        record_id TEXT,
        action TEXT NOT NULL,
        actor_role TEXT NOT NULL,
        actor_name TEXT NOT NULL DEFAULT '',
        before_json TEXT,
        after_json TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY(record_id) REFERENCES web_admin_records(id)
    );

    CREATE INDEX IF NOT EXISTS idx_web_admin_audit_events_record_id
        ON web_admin_audit_events (record_id);
    CREATE INDEX IF NOT EXISTS idx_web_admin_audit_events_action
        ON web_admin_audit_events (action);

    CREATE TABLE IF NOT EXISTS web_admin_test_users (
        id TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        role TEXT NOT NULL,
        access_code_hash TEXT,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_web_admin_test_users_role
        ON web_admin_test_users (role);
    CREATE INDEX IF NOT EXISTS idx_web_admin_test_users_is_active
        ON web_admin_test_users (is_active);
    """
    execute_script(statements)

    if seed:
        from datetime import datetime
        from uuid import uuid4

        existing = fetch_one("SELECT id FROM web_admin_records WHERE title = ?", ("測試廟務 A",))
        if existing:
            return
        now = datetime.utcnow().isoformat()
        record_id = str(uuid4())
        execute(
            """
            INSERT INTO web_admin_records (
                id, module_key, title, summary, status, record_date, responsible, category,
                fields_json, tags_json, created_at, updated_at, created_by, updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record_id,
                "temple-affairs",
                "測試廟務 A",
                "本機開發用示範資料。",
                "active",
                now[:10],
                "測試人員",
                "廟務測試",
                encode_json({"note": "可安全重跑的示範資料"}),
                encode_json(["本機測試"]),
                now,
                now,
                "local-dev",
                "local-dev",
            ),
        )
