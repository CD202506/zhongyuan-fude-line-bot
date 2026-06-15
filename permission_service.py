from typing import Any


def normalize_text(value: Any) -> str:
    return str(value or "").strip()


def is_yes(value: Any) -> bool:
    return normalize_text(value).lower() in {"yes", "y", "true", "1", "是"}


def find_member_by_line_uid(
    line_user_id: str | None,
    members: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not line_user_id:
        return None

    for member in members:
        if normalize_text(member.get("line_uid")) == normalize_text(line_user_id):
            return member

    return None


def can_view_internal_shrine(member: dict[str, Any] | None) -> bool:
    if not member:
        return False

    return (
        is_yes(member.get("active"))
        and is_yes(member.get("can_view_internal_shrine"))
    )
