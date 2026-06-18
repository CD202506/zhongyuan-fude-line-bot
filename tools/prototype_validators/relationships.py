"""Relationship validators for local Web Admin V2 prototype data."""

from __future__ import annotations

from datetime import date


class RelationshipValidationError(ValueError):
    """Raised when prototype relationship data is inconsistent."""


def require_existing_id(record_id: str, existing_ids: set[str], label: str) -> None:
    if not record_id or record_id not in existing_ids:
        raise RelationshipValidationError(f"Unknown {label}: {record_id!r}")


def validate_temple(record: dict) -> None:
    if not record.get("temple_id"):
        raise RelationshipValidationError("Temple record requires temple_id")


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

