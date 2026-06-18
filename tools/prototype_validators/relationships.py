"""Relationship validators for local Web Admin V2 prototype data."""

from __future__ import annotations

from datetime import date


class RelationshipValidationError(ValueError):
    """Raised when prototype relationship data is inconsistent."""


EVENT_DESCRIPTION_TERMS = {"參訪", "祝壽", "請帖", "會香", "來訪", "邀請"}
SYSTEM_LOG_TYPES = {"友宮資料更新", "帳務流水", "善信紀錄", "查無資料", "補資料建議", "LINE 查詢紀錄", "mock/dev data"}
TEAM_MODULE_ALLOWED_SECTIONS = {"團隊成員列表", "值勤班表"}
TEAM_MODULE_FORBIDDEN_SECTIONS = {"廟務職務 / 系統權限", "系統權限設定", "查看職務 / 權限", "查看職務任期"}


def require_existing_id(record_id: str, existing_ids: set[str], label: str) -> None:
    if not record_id or record_id not in existing_ids:
        raise RelationshipValidationError(f"Unknown {label}: {record_id!r}")


def validate_temple(record: dict) -> None:
    if not record.get("temple_id"):
        raise RelationshipValidationError("Temple record requires temple_id")


def validate_temple_name_is_master_record(name: str) -> None:
    if not name or not name.strip():
        raise RelationshipValidationError("Temple name is required")
    matched_terms = [term for term in EVENT_DESCRIPTION_TERMS if term in name]
    if matched_terms:
        raise RelationshipValidationError(f"Temple name must not include event terms: {', '.join(matched_terms)}")


def validate_visit_row_semantics(row: dict) -> None:
    validate_temple_name_is_master_record(row.get("temple_name", ""))
    subject = row.get("subject", "")
    if not subject:
        raise RelationshipValidationError("Visit row requires subject in a separate field")


def validate_dashboard_recent_record(record: dict) -> None:
    record_type = record.get("type", "")
    title = record.get("title", "")
    if record_type in SYSTEM_LOG_TYPES:
        raise RelationshipValidationError(f"Dashboard recent record must not use system log type: {record_type}")
    if any(term in title for term in {"查無資料", "補資料", "LINE 查詢", "mock/dev data", "資料更新", "帳務流水", "善信紀錄"}):
        raise RelationshipValidationError("Dashboard recent record title must be a human-readable temple affair event")


def validate_visit_type_master_location(section_name: str, has_master_type_list: bool) -> None:
    if section_name == "來訪 / 請帖紀錄列表" and has_master_type_list:
        raise RelationshipValidationError("Visit type master list belongs in admin settings, not the general visit list")


def validate_team_module_sections(sections: list[str]) -> None:
    section_set = set(sections)
    forbidden = section_set.intersection(TEAM_MODULE_FORBIDDEN_SECTIONS)
    if forbidden:
        raise RelationshipValidationError(f"Team module contains forbidden quick-card sections: {', '.join(sorted(forbidden))}")
    if not TEAM_MODULE_ALLOWED_SECTIONS.issubset(section_set):
        raise RelationshipValidationError("Team module must include team member list and duty roster")


def build_visit_from_temple(temple_id: str, temple_ids: set[str]) -> dict:
    require_existing_id(temple_id, temple_ids, "temple_id")
    return {"temple_id": temple_id}


def build_announcement_from_temple(temple_id: str, temple_ids: set[str]) -> dict:
    require_existing_id(temple_id, temple_ids, "temple_id")
    return {"related_temple_id": temple_id}


def build_announcement_from_visit(visit_id: str, visits: dict[str, dict]) -> dict:
    if visit_id not in visits:
        raise RelationshipValidationError(f"Unknown visit_id: {visit_id!r}")
    visit = visits[visit_id]
    require_existing_id(visit.get("temple_id"), {visit["temple_id"]}, "temple_id")
    return {"related_visit_id": visit_id, "related_temple_id": visit["temple_id"]}


def validate_announcement_relation(announcement: dict, visits: dict[str, dict]) -> None:
    related_visit_id = announcement.get("related_visit_id") or announcement.get("relatedVisitId")
    if related_visit_id:
        build_announcement_from_visit(related_visit_id, visits)
    if announcement.get("record_type") == "visit":
        raise RelationshipValidationError("Announcement must not replace the visit master record")


def validate_devotee_record(record: dict) -> None:
    if not record.get("devotee_id"):
        raise RelationshipValidationError("Devotee record requires devotee_id")


def validate_devotee_relationship(record: dict, devotees: set[str]) -> None:
    validate_devotee_record(record)
    require_existing_id(record["devotee_id"], devotees, "devotee_id")


def validate_duty_roster(roster: dict, team_member_ids: set[str]) -> None:
    require_existing_id(roster.get("team_member_id"), team_member_ids, "team_member_id")
    start = date.fromisoformat(roster["duty_start_date"])
    end = date.fromisoformat(roster["duty_end_date"])
    if end < start:
        raise RelationshipValidationError("Duty end date must not be before start date")


def duty_candidates_from_rosters(rosters: list[dict], team_member_ids: set[str]) -> set[str]:
    candidates: set[str] = set()
    for roster in rosters:
        validate_duty_roster(roster, team_member_ids)
        candidates.add(roster["team_member_id"])
    return candidates
