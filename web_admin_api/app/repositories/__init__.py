from .sqlite_records import SQLiteRecordsRepository


def get_records_repository():
    from ..db import get_database_mode

    if get_database_mode() == "postgres":
        from .postgres_records import PostgresRecordsRepository

        return PostgresRecordsRepository()

    return SQLiteRecordsRepository()
