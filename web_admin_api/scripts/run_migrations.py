from __future__ import annotations

from pathlib import Path
import sqlite3
import sys

API_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = API_ROOT.parent
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

from app.config import get_settings  # noqa: E402
from app.db import get_local_sqlite_path, init_local_database  # noqa: E402


MIGRATIONS_DIR = API_ROOT / "migrations"


def migration_files() -> list[Path]:
    return sorted(MIGRATIONS_DIR.glob("*.sql"))


def run_sqlite_migrations() -> None:
    init_local_database(seed=False)
    db_path = get_local_sqlite_path()
    with sqlite3.connect(db_path) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS web_admin_schema_migrations (
                filename TEXT PRIMARY KEY,
                applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.commit()
    print(f"local sqlite migration check complete: {db_path}")


def run_postgresql_migrations(database_url: str) -> None:
    import psycopg

    files = migration_files()
    if not files:
        print("no migration files found")
        return

    with psycopg.connect(database_url) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS web_admin_schema_migrations (
                    filename TEXT PRIMARY KEY,
                    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
                )
                """
            )
            for migration in files:
                cursor.execute("SELECT 1 FROM web_admin_schema_migrations WHERE filename = %s", (migration.name,))
                if cursor.fetchone():
                    print(f"skipped migration: {migration.name}")
                    continue
                cursor.execute(migration.read_text(encoding="utf-8"))
                cursor.execute("INSERT INTO web_admin_schema_migrations (filename) VALUES (%s)", (migration.name,))
                print(f"applied migration: {migration.name}")
        connection.commit()

    print("postgresql migration check complete")


def main() -> None:
    settings = get_settings()
    if settings.database_url:
        run_postgresql_migrations(settings.database_url)
        return

    run_sqlite_migrations()


if __name__ == "__main__":
    main()
