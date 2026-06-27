from typing import Any
from uuid import UUID

from fastapi import APIRouter

from ..db import decode_json, fetch_all
from ..schemas import AuditEventResponse

router = APIRouter(tags=["audit"])


def row_to_audit_event(row: Any) -> AuditEventResponse:
    data = dict(row)
    data["before_json"] = decode_json(data.get("before_json"), None)
    data["after_json"] = decode_json(data.get("after_json"), None)
    return AuditEventResponse(**data)


@router.get("/records/{record_id}/audit-events", response_model=list[AuditEventResponse])
def list_audit_events(record_id: UUID) -> list[AuditEventResponse]:
    rows = fetch_all(
        """
        SELECT * FROM web_admin_audit_events
        WHERE record_id = ?
        ORDER BY created_at ASC
        """,
        (str(record_id),),
    )
    return [row_to_audit_event(row) for row in rows]
