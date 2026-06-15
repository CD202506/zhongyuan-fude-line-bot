from datetime import datetime
from typing import Any

from permission_service import normalize_text


def find_recent_query_logs(
    records: list[dict[str, Any]],
    limit: int = 5,
) -> list[dict[str, Any]]:
    return _sort_recent(records)[:limit]


def find_recent_not_found_logs(
    records: list[dict[str, Any]],
    limit: int = 5,
) -> list[dict[str, Any]]:
    not_found = [
        record
        for record in records
        if normalize_text(record.get("result_status")).lower() == "not_found"
    ]
    return _sort_recent(not_found)[:limit]


def _sort_recent(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    ranked = [
        (
            record,
            _parse_datetime(normalize_text(record.get("query_datetime"))),
            index,
        )
        for index, record in enumerate(records)
    ]

    if not any(parsed_datetime for _, parsed_datetime, _ in ranked):
        return list(reversed(records))

    ranked.sort(
        key=lambda item: (
            item[1] is not None,
            item[1] or float("-inf"),
            item[2],
        ),
        reverse=True,
    )
    return [record for record, _, _ in ranked]


def _parse_datetime(value: str) -> float | None:
    if not value:
        return None

    normalized = value.replace("Z", "+00:00")

    try:
        return datetime.fromisoformat(normalized).timestamp()
    except ValueError:
        pass

    for date_format in (
        "%Y/%m/%d %H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y/%m/%d",
        "%Y-%m-%d",
    ):
        try:
            return datetime.strptime(value, date_format).timestamp()
        except ValueError:
            continue

    return None
