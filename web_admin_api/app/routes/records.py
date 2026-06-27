from uuid import UUID

from fastapi import APIRouter, Query

from ..repositories import get_records_repository
from ..schemas import ArchiveRequest, RecordCreate, RecordResponse, RecordUpdate, RestoreRequest

router = APIRouter(tags=["records"])


@router.get("/records", response_model=list[RecordResponse])
def list_records(
    module_key: str | None = None,
    q: str | None = None,
    status: str | None = Query(default=None),
    include_archived: bool = False,
) -> list[RecordResponse]:
    return get_records_repository().list_records(module_key=module_key, q=q, status=status, include_archived=include_archived)


@router.post("/records", response_model=RecordResponse)
def create_record(payload: RecordCreate) -> RecordResponse:
    return get_records_repository().create_record(payload)


@router.get("/records/{record_id}", response_model=RecordResponse)
def get_record(record_id: UUID) -> RecordResponse:
    return get_records_repository().get_record(record_id)


@router.patch("/records/{record_id}", response_model=RecordResponse)
def update_record(record_id: UUID, payload: RecordUpdate) -> RecordResponse:
    return get_records_repository().update_record(record_id, payload)


@router.post("/records/{record_id}/archive", response_model=RecordResponse)
def archive_record(record_id: UUID, payload: ArchiveRequest | None = None) -> RecordResponse:
    return get_records_repository().archive_record(record_id, payload)


@router.post("/records/{record_id}/restore", response_model=RecordResponse)
def restore_record(record_id: UUID, payload: RestoreRequest | None = None) -> RecordResponse:
    return get_records_repository().restore_record(record_id, payload)
