from dataclasses import dataclass, field
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4


@dataclass
class WebAdminRecord:
    module_key: str
    title: str
    summary: str = ""
    status: str = "active"
    id: UUID = field(default_factory=uuid4)
    fields_json: dict[str, Any] = field(default_factory=dict)
    tags_json: list[str] = field(default_factory=list)
    is_archived: bool = False
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class AuditEvent:
    record_id: UUID
    action: str
    actor_role: str
    actor_name: str
    before_json: dict[str, Any] | None = None
    after_json: dict[str, Any] | None = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)
