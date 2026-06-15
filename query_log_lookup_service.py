from datetime import datetime
from typing import Any

from permission_service import normalize_text


_MANAGEMENT_QUERY_TYPES = {
    "log_recent",
    "log_not_found",
    "backfill_suggestions",
}
_BACKFILL_QUERY_TYPES = {"shrine", "visit", "announcement", "unknown"}


def find_recent_query_logs(
    records: list[dict[str, Any]],
    limit: int = 5,
) -> list[dict[str, Any]]:
    general_records = [
        record
        for record in records
        if _get_query_type(record) not in _MANAGEMENT_QUERY_TYPES
    ]
    return _sort_recent(general_records)[:limit]


def find_recent_not_found_logs(
    records: list[dict[str, Any]],
    limit: int = 5,
) -> list[dict[str, Any]]:
    not_found = [
        record
        for record in records
        if (
            normalize_text(record.get("result_status")).lower() == "not_found"
            and _get_query_type(record) not in _MANAGEMENT_QUERY_TYPES
        )
    ]
    return _sort_recent(not_found)[:limit]


def build_backfill_suggestions(
    records: list[dict[str, Any]],
    limit: int = 5,
) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str], dict[str, Any]] = {}

    for index, record in enumerate(records):
        query_type = _get_query_type(record)
        result_status = normalize_text(record.get("result_status")).lower()
        query_text = " ".join(normalize_text(record.get("query_text")).split())
        target_sheet = normalize_text(record.get("target_sheet")).lower()

        if (
            result_status != "not_found"
            or query_type in _MANAGEMENT_QUERY_TYPES
            or query_type not in _BACKFILL_QUERY_TYPES
            or not query_text
        ):
            continue

        key = (query_text, query_type, target_sheet)
        query_datetime = normalize_text(record.get("query_datetime"))
        latest_timestamp = _parse_datetime(query_datetime)
        latest_key = (
            latest_timestamp is not None,
            latest_timestamp or float("-inf"),
            index,
        )

        if key not in grouped:
            grouped[key] = {
                "query_text": query_text,
                "query_type": query_type,
                "target_sheet": target_sheet,
                "count": 0,
                "latest_query_datetime": query_datetime,
                "_latest_key": latest_key,
            }

        suggestion = grouped[key]
        suggestion["count"] += 1

        if latest_key > suggestion["_latest_key"]:
            suggestion["latest_query_datetime"] = query_datetime
            suggestion["_latest_key"] = latest_key

    suggestions = list(grouped.values())
    suggestions.sort(
        key=lambda item: (
            item["count"],
            item["_latest_key"],
        ),
        reverse=True,
    )

    return [
        {
            key: value
            for key, value in suggestion.items()
            if not key.startswith("_")
        }
        for suggestion in suggestions[:limit]
    ]


def _get_query_type(record: dict[str, Any]) -> str:
    return normalize_text(record.get("query_type")).lower()


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
