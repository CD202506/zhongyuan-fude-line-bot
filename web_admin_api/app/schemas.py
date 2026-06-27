from datetime import date, datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "web_admin_api"
    mode: str = "sqlite"
    database_status: str = "ready"


class ModuleResponse(BaseModel):
    key: str
    title: str
    description: str
    boundary: str
    can_create_roles: list[str]
    can_archive_roles: list[str]


class RecordBase(BaseModel):
    module_key: str
    title: str
    summary: str = ""
    status: str = "active"
    record_date: date | None = None
    due_date: date | None = None
    responsible: str = ""
    category: str = ""
    fields_json: dict[str, Any] = Field(default_factory=dict)
    tags_json: list[str] = Field(default_factory=list)


class RecordCreate(RecordBase):
    actor_role: str = "staff"
    actor_name: str = "測試使用者"


class RecordUpdate(BaseModel):
    title: str | None = None
    summary: str | None = None
    status: str | None = None
    record_date: date | None = None
    due_date: date | None = None
    responsible: str | None = None
    category: str | None = None
    fields_json: dict[str, Any] | None = None
    tags_json: list[str] | None = None
    actor_role: str = "staff"
    actor_name: str = "測試使用者"


class RecordResponse(RecordBase):
    id: UUID
    is_archived: bool = False
    archived_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    created_by: str = ""
    updated_by: str = ""


class ArchiveRequest(BaseModel):
    actor_role: str = "admin"
    actor_name: str = "測試管理者"


class RestoreRequest(BaseModel):
    status: str = "active"
    actor_role: str = "admin"
    actor_name: str = "測試管理者"


class AuditEventResponse(BaseModel):
    id: UUID
    record_id: UUID
    action: str
    actor_role: str
    actor_name: str
    before_json: dict[str, Any] | None = None
    after_json: dict[str, Any] | None = None
    created_at: datetime
