"""Permission boundary validators for Web Admin V2 prototype tests."""

from __future__ import annotations


ADMIN_PERMISSION = "admin"
SYSTEM_PERMISSIONS = {"admin", "staff", "viewer"}


def can_access_admin_settings(permission: str) -> bool:
    return permission == ADMIN_PERMISSION


def can_devotee_read_record(requesting_devotee_id: str, record: dict) -> bool:
    return bool(record.get("authorized")) and record.get("devotee_id") == requesting_devotee_id


def is_system_permission(value: str) -> bool:
    return value in SYSTEM_PERMISSIONS


def is_temple_role_system_permission(temple_role: str) -> bool:
    return is_system_permission(temple_role)


def team_member_is_not_automatically_admin(team_member: dict) -> bool:
    return team_member.get("system_permission") != ADMIN_PERMISSION

