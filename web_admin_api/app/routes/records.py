from datetime import datetime
from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query

from ..schemas import RecordCreate, RecordResponse, RecordUpdate

router = APIRouter(tags=["records"])


@router.get("/records", response_model=list[RecordResponse])
def list_records(
    module_key: str | None = None,
    q: str | None = None,
    status: str | None = Query(default=None),
) -> list[RecordResponse]:
    return []


@router.post("/records", response_model=RecordResponse)
def create_record(payload: RecordCreate) -> RecordResponse:
    now = datetime.utcnow()
    return RecordResponse(
        **payload.model_dump(exclude={"actor_role", "actor_name"}),
        id=uuid4(),
        created_at=now,
        updated_at=now,
        created_by=payload.actor_name,
        updated_by=payload.actor_name,
    )


@router.get("/records/{record_id}", response_model=RecordResponse)
def get_record(record_id: UUID) -> RecordResponse:
    raise HTTPException(status_code=404, detail=f"Record not found: {record_id}")


@router.patch("/records/{record_id}", response_model=RecordResponse)
def update_record(record_id: UUID, payload: RecordUpdate) -> RecordResponse:
    raise HTTPException(status_code=501, detail=f"Record update not wired yet: {record_id}")


@router.post("/records/{record_id}/archive")
def archive_record(record_id: UUID) -> dict[str, str]:
    return {"record_id": str(record_id), "status": "archive_requested"}


@router.post("/records/{record_id}/restore")
def restore_record(record_id: UUID) -> dict[str, str]:
    return {"record_id": str(record_id), "status": "restore_requested"}
