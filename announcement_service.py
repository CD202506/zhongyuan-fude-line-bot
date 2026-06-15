from datetime import datetime
from typing import Any

from permission_service import normalize_text


_STATUS_FIELDS = ("status", "publish_status")
_DATE_FIELDS = ("event_date", "publish_date", "created_at", "updated_at")
_HIDDEN_STATUSES = {"draft", "archived", "archive"}
_PREFERRED_STATUSES = {"published", "ready"}


def find_latest_announcements(
    announcements: list[dict[str, Any]],
    limit: int = 3,
) -> list[dict[str, Any]]:
    visible = [
        announcement
        for announcement in announcements
        if _get_status(announcement) not in _HIDDEN_STATUSES
    ]
    ranked = [
        (
            announcement,
            _get_status(announcement) in _PREFERRED_STATUSES,
            _parse_date(first_value(announcement, _DATE_FIELDS)),
            index,
        )
        for index, announcement in enumerate(visible)
    ]

    if any(item[2] is not None for item in ranked):
        ranked.sort(
            key=lambda item: (
                item[1],
                item[2] is not None,
                item[2] or float("-inf"),
                item[3],
            ),
            reverse=True,
        )
    else:
        ranked.sort(
            key=lambda item: (item[1], item[3]),
            reverse=True,
        )

    return [announcement for announcement, _, _, _ in ranked[:limit]]


def get_announcement_display_fields(
    announcement: dict[str, Any],
) -> dict[str, str]:
    return {
        "title": first_value(announcement, ("line_title", "title")),
        "body": first_value(
            announcement,
            ("line_body", "body", "content", "description"),
        ),
        "date": first_value(announcement, ("event_date", "publish_date")),
        "time": first_value(announcement, ("event_time", "time")),
        "location": first_value(announcement, ("location", "venue", "place")),
    }


def first_value(record: dict[str, Any], fields: tuple[str, ...]) -> str:
    for field in fields:
        value = normalize_text(record.get(field))
        if value:
            return value

    return ""


def _get_status(announcement: dict[str, Any]) -> str:
    return first_value(announcement, _STATUS_FIELDS).lower()


def _parse_date(value: str) -> float | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")

    try:
        return datetime.fromisoformat(normalized).timestamp()
    except ValueError:
        pass

    for date_format in (
        "%Y/%m/%d",
        "%Y-%m-%d",
        "%Y.%m.%d",
        "%Y/%m/%d %H:%M",
        "%Y-%m-%d %H:%M:%S",
    ):
        try:
            return datetime.strptime(value, date_format).timestamp()
        except ValueError:
            continue

    return None
