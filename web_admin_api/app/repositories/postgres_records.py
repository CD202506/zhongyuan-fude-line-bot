from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import HTTPException

from ..db import get_postgres_connection
from ..schemas import ArchiveRequest, AuditEventResponse, RecordCreate, RecordResponse, RecordUpdate, RestoreRequest


def json_param(value: Any) -> Any:
    from psycopg.types.json import Jsonb

    return Jsonb(value)


class PostgresRecordsRepository:
    def row_to_record(self, row: dict[str, Any]) -> RecordResponse:
        return RecordResponse(**row)

    def row_to_audit_event(self, row: dict[str, Any]) -> AuditEventResponse:
        return AuditEventResponse(**row)

    def get_record_row(self, record_id: UUID) -> dict[str, Any]:
        with get_postgres_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT * FROM web_admin_records WHERE id = %s", (record_id,))
                row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Record not found: {record_id}")
        return row

    def create_audit_event(
        self,
        cursor: Any,
        record_id: UUID,
        action: str,
        actor_role: str,
        actor_name: str,
        before_json: dict[str, Any] | None,
        after_json: dict[str, Any] | None,
    ) -> None:
        cursor.execute(
            """
            INSERT INTO web_admin_audit_events (
                record_id, action, actor_role, actor_name, before_json, after_json
            ) VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                record_id,
                action,
                actor_role,
                actor_name,
                json_param(before_json) if before_json is not None else None,
                json_param(after_json) if after_json is not None else None,
            ),
        )

    def list_records(
        self,
        module_key: str | None = None,
        q: str | None = None,
        status: str | None = None,
        include_archived: bool = False,
    ) -> list[RecordResponse]:
        clauses: list[str] = []
        params: list[Any] = []

        if module_key:
            clauses.append("module_key = %s")
            params.append(module_key)
        if status:
            clauses.append("status = %s")
            params.append(status)
        if not include_archived:
            clauses.append("is_archived = FALSE")
        if q:
            like = f"%{q}%"
            clauses.append("(title ILIKE %s OR summary ILIKE %s OR responsible ILIKE %s OR category ILIKE %s)")
            params.extend([like, like, like, like])

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
        with get_postgres_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT * FROM web_admin_records
                    {where_sql}
                    ORDER BY updated_at DESC, created_at DESC
                    """,
                    params,
                )
                rows = cursor.fetchall()
        return [self.row_to_record(row) for row in rows]

    def create_record(self, payload: RecordCreate) -> RecordResponse:
        with get_postgres_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO web_admin_records (
                        module_key, title, summary, status, record_date, due_date, responsible, category,
                        fields_json, tags_json, created_by, updated_by
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING *
                    """,
                    (
                        payload.module_key,
                        payload.title,
                        payload.summary,
                        payload.status,
                        payload.record_date,
                        payload.due_date,
                        payload.responsible,
                        payload.category,
                        json_param(payload.fields_json),
                        json_param(payload.tags_json),
                        payload.actor_name,
                        payload.actor_name,
                    ),
                )
                row = cursor.fetchone()
                record = self.row_to_record(row)
                self.create_audit_event(cursor, record.id, "create", payload.actor_role, payload.actor_name, None, record.model_dump(mode="json"))
                connection.commit()
                return record

    def get_record(self, record_id: UUID) -> RecordResponse:
        return self.row_to_record(self.get_record_row(record_id))

    def update_record(self, record_id: UUID, payload: RecordUpdate) -> RecordResponse:
        before = self.get_record(record_id)
        update_data = payload.model_dump(exclude_unset=True, exclude={"actor_role", "actor_name"})
        if not update_data:
            return before

        assignments: list[str] = []
        params: list[Any] = []
        for key, value in update_data.items():
            assignments.append(f"{key} = %s")
            params.append(json_param(value) if key in {"fields_json", "tags_json"} else value)

        assignments.extend(["updated_at = now()", "updated_by = %s"])
        params.extend([payload.actor_name, record_id])
        with get_postgres_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(f"UPDATE web_admin_records SET {', '.join(assignments)} WHERE id = %s RETURNING *", params)
                row = cursor.fetchone()
                after = self.row_to_record(row)
                self.create_audit_event(cursor, record_id, "update", payload.actor_role, payload.actor_name, before.model_dump(mode="json"), after.model_dump(mode="json"))
                connection.commit()
                return after

    def archive_record(self, record_id: UUID, payload: ArchiveRequest | None = None) -> RecordResponse:
        payload = payload or ArchiveRequest()
        before = self.get_record(record_id)
        with get_postgres_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE web_admin_records
                    SET is_archived = TRUE, archived_at = now(), status = %s, updated_at = now(), updated_by = %s
                    WHERE id = %s
                    RETURNING *
                    """,
                    ("archived", payload.actor_name, record_id),
                )
                row = cursor.fetchone()
                after = self.row_to_record(row)
                self.create_audit_event(cursor, record_id, "archive", payload.actor_role, payload.actor_name, before.model_dump(mode="json"), after.model_dump(mode="json"))
                connection.commit()
                return after

    def restore_record(self, record_id: UUID, payload: RestoreRequest | None = None) -> RecordResponse:
        payload = payload or RestoreRequest()
        before = self.get_record(record_id)
        with get_postgres_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE web_admin_records
                    SET is_archived = FALSE, archived_at = NULL, status = %s, updated_at = now(), updated_by = %s
                    WHERE id = %s
                    RETURNING *
                    """,
                    (payload.status, payload.actor_name, record_id),
                )
                row = cursor.fetchone()
                after = self.row_to_record(row)
                self.create_audit_event(cursor, record_id, "restore", payload.actor_role, payload.actor_name, before.model_dump(mode="json"), after.model_dump(mode="json"))
                connection.commit()
                return after

    def list_audit_events(self, record_id: UUID) -> list[AuditEventResponse]:
        with get_postgres_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT * FROM web_admin_audit_events
                    WHERE record_id = %s
                    ORDER BY created_at ASC
                    """,
                    (record_id,),
                )
                rows = cursor.fetchall()
        return [self.row_to_audit_event(row) for row in rows]
