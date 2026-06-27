from uuid import UUID

from fastapi import APIRouter

from ..schemas import AuditEventResponse

router = APIRouter(tags=["audit"])


@router.get("/records/{record_id}/audit-events", response_model=list[AuditEventResponse])
def list_audit_events(record_id: UUID) -> list[AuditEventResponse]:
    return []
