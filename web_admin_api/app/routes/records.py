from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query

from ..db import decode_json, encode_json, execute, fetch_all, fetch_one
from ..schemas import ArchiveRequest, RecordCreate, RecordResponse, RecordUpdate, RestoreRequest

router = APIRouter(tags=["records"])


def now_iso() -> str:
    return datetime.utcnow().isoformat()


def row_to_dict(row: Any) -> dict[str, Any]:
    return dict(row)


def row_to_record(row: Any) -> RecordResponse:
    data = row_to_dict(row)
    data["fields_json"] = decode_json(data.get("fields_json"), {})
    data["tags_json"] = decode_json(data.get("tags_json"), [])
    data["is_archived"] = bool(data.get("is_archived"))
    return RecordResponse(**data)


def get_record_row(record_id: UUID) -> Any:
    row = fetch_one("SELECT * FROM web_admin_records WHERE id = ?", (str(record_id),))
    if not row:
        raise HTTPException(status_code=404, detail=f"Record not found: {record_id}")
    return row


def create_audit_event(
    record_id: UUID,
    action: str,
    actor_role: str,
    actor_name: str,
    before_json: dict[str, Any] | None,
    after_json: dict[str, Any] | None,
) -> None:
    execute(
        """
        INSERT INTO web_admin_audit_events (
            id, record_id, action, actor_role, actor_name, before_json, after_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid4()),
            str(record_id),
            action,
            actor_role,
            actor_name,
            encode_json(before_json) if before_json is not None else None,
            encode_json(after_json) if after_json is not None else None,
            now_iso(),
        ),
    )


@router.get("/records", response_model=list[RecordResponse])
def list_records(
    module_key: str | None = None,
    q: str | None = None,
    status: str | None = Query(default=None),
    include_archived: bool = False,
) -> list[RecordResponse]:
    clauses: list[str] = []
    params: list[Any] = []

    if module_key:
        clauses.append("module_key = ?")
        params.append(module_key)
    if status:
        clauses.append("status = ?")
        params.append(status)
    if not include_archived:
        clauses.append("is_archived = 0")
    if q:
        like = f"%{q}%"
        clauses.append("(title LIKE ? OR summary LIKE ? OR responsible LIKE ? OR category LIKE ?)")
        params.extend([like, like, like, like])

    where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    rows = fetch_all(
        f"""
        SELECT * FROM web_admin_records
        {where_sql}
        ORDER BY updated_at DESC, created_at DESC
        """,
        params,
    )
    return [row_to_record(row) for row in rows]


@router.post("/records", response_model=RecordResponse)
def create_record(payload: RecordCreate) -> RecordResponse:
    record_id = uuid4()
    now = now_iso()
    execute(
        """
        INSERT INTO web_admin_records (
            id, module_key, title, summary, status, record_date, due_date, responsible, category,
            fields_json, tags_json, is_archived, archived_at, created_at, updated_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?, ?)
        """,
        (
            str(record_id),
            payload.module_key,
            payload.title,
            payload.summary,
            payload.status,
            payload.record_date.isoformat() if payload.record_date else None,
            payload.due_date.isoformat() if payload.due_date else None,
            payload.responsible,
            payload.category,
            encode_json(payload.fields_json),
            encode_json(payload.tags_json),
            now,
            now,
            payload.actor_name,
            payload.actor_name,
        ),
    )
    record = row_to_record(get_record_row(record_id))
    create_audit_event(record_id, "create", payload.actor_role, payload.actor_name, None, record.model_dump(mode="json"))
    return record


@router.get("/records/{record_id}", response_model=RecordResponse)
def get_record(record_id: UUID) -> RecordResponse:
    return row_to_record(get_record_row(record_id))


@router.patch("/records/{record_id}", response_model=RecordResponse)
def update_record(record_id: UUID, payload: RecordUpdate) -> RecordResponse:
    before = row_to_record(get_record_row(record_id))
    update_data = payload.model_dump(exclude_unset=True, exclude={"actor_role", "actor_name"})
    if not update_data:
        return before

    assignments: list[str] = []
    params: list[Any] = []
    for key, value in update_data.items():
        assignments.append(f"{key} = ?")
        if key in {"fields_json", "tags_json"}:
            params.append(encode_json(value))
        elif key in {"record_date", "due_date"} and value is not None:
            params.append(value.isoformat())
        else:
            params.append(value)

    assignments.extend(["updated_at = ?", "updated_by = ?"])
    params.extend([now_iso(), payload.actor_name, str(record_id)])
    execute(f"UPDATE web_admin_records SET {', '.join(assignments)} WHERE id = ?", params)
    after = row_to_record(get_record_row(record_id))
    create_audit_event(record_id, "update", payload.actor_role, payload.actor_name, before.model_dump(mode="json"), after.model_dump(mode="json"))
    return after


@router.post("/records/{record_id}/archive", response_model=RecordResponse)
def archive_record(record_id: UUID, payload: ArchiveRequest | None = None) -> RecordResponse:
    payload = payload or ArchiveRequest()
    before = row_to_record(get_record_row(record_id))
    now = now_iso()
    execute(
        """
        UPDATE web_admin_records
        SET is_archived = 1, archived_at = ?, status = ?, updated_at = ?, updated_by = ?
        WHERE id = ?
        """,
        (now, "archived", now, payload.actor_name, str(record_id)),
    )
    after = row_to_record(get_record_row(record_id))
    create_audit_event(record_id, "archive", payload.actor_role, payload.actor_name, before.model_dump(mode="json"), after.model_dump(mode="json"))
    return after


@router.post("/records/{record_id}/restore", response_model=RecordResponse)
def restore_record(record_id: UUID, payload: RestoreRequest | None = None) -> RecordResponse:
    payload = payload or RestoreRequest()
    before = row_to_record(get_record_row(record_id))
    now = now_iso()
    execute(
        """
        UPDATE web_admin_records
        SET is_archived = 0, archived_at = NULL, status = ?, updated_at = ?, updated_by = ?
        WHERE id = ?
        """,
        (payload.status, now, payload.actor_name, str(record_id)),
    )
    after = row_to_record(get_record_row(record_id))
    create_audit_event(record_id, "restore", payload.actor_role, payload.actor_name, before.model_dump(mode="json"), after.model_dump(mode="json"))
    return after
