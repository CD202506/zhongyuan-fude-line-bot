from datetime import datetime
from typing import Any

from permission_service import normalize_text


_SHRINE_ID_FIELDS = ("related_shrine_id", "shrine_id")
_SHRINE_NAME_FIELDS = ("related_shrine_name", "shrine_name")
_DATE_FIELDS = ("event_date", "visit_date", "created_at")
_TYPE_FIELDS = ("visit_type", "event_type", "type", "category")
_ACTIVITY_FIELDS = ("event_name", "activity", "title", "subject")
_NOTE_FIELDS = ("note", "notes", "remark", "remarks", "description")


def find_recent_shrine_visits(
    shrine: dict[str, Any],
    visits: list[dict[str, Any]],
    limit: int = 3,
) -> list[dict[str, Any]]:
    shrine_id = normalize_text(shrine.get("shrine_id"))
    shrine_name = normalize_text(shrine.get("name"))
    matched = [
        visit
        for visit in visits
        if _matches_shrine(visit, shrine_id, shrine_name)
    ]

    return _sort_recent(matched)[:limit]


def find_recent_shrine_visits_by_keyword(
    query_text: str,
    visits: list[dict[str, Any]],
    limit: int = 3,
) -> tuple[str, list[dict[str, Any]]]:
    query = normalize_text(query_text)

    if not query:
        return "", []

    identity_type, identity = _find_best_identity(visits, query)

    if not identity:
        return "", []

    matched = [
        visit
        for visit in visits
        if _has_identity(visit, identity_type, identity)
    ]
    sorted_matches = _sort_recent(matched)[:limit]
    display_name = (
        first_value(sorted_matches[0], _SHRINE_NAME_FIELDS)
        or identity
    )
    return display_name, sorted_matches


def get_visit_display_fields(visit: dict[str, Any]) -> dict[str, str]:
    return {
        "date": first_value(visit, _DATE_FIELDS),
        "type": first_value(visit, _TYPE_FIELDS),
        "activity": first_value(visit, _ACTIVITY_FIELDS),
        "note": first_value(visit, _NOTE_FIELDS),
    }


def first_value(record: dict[str, Any], fields: tuple[str, ...]) -> str:
    for field in fields:
        value = normalize_text(record.get(field))
        if value:
            return value

    return ""


def _matches_shrine(
    visit: dict[str, Any],
    shrine_id: str,
    shrine_name: str,
) -> bool:
    visit_ids = {
        normalize_text(visit.get(field))
        for field in _SHRINE_ID_FIELDS
        if normalize_text(visit.get(field))
    }
    visit_names = {
        normalize_text(visit.get(field))
        for field in _SHRINE_NAME_FIELDS
        if normalize_text(visit.get(field))
    }

    return bool(
        (shrine_id and shrine_id in visit_ids)
        or (shrine_name and shrine_name in visit_names)
    )


def _find_best_identity(
    visits: list[dict[str, Any]],
    query: str,
) -> tuple[str, str]:
    candidates = []

    for visit_index, visit in enumerate(visits):
        for identity_type, fields, exact_score, partial_score in (
            ("name", _SHRINE_NAME_FIELDS, 4, 2),
            ("id", _SHRINE_ID_FIELDS, 3, 1),
        ):
            for field in fields:
                value = normalize_text(visit.get(field))

                if value == query:
                    candidates.append(
                        (exact_score, -len(value), -visit_index, identity_type, value)
                    )
                elif query in value:
                    candidates.append(
                        (partial_score, -len(value), -visit_index, identity_type, value)
                    )

    if not candidates:
        return "", ""

    _, _, _, identity_type, identity = max(candidates)
    return identity_type, identity


def _has_identity(
    visit: dict[str, Any],
    identity_type: str,
    identity: str,
) -> bool:
    fields = _SHRINE_NAME_FIELDS if identity_type == "name" else _SHRINE_ID_FIELDS
    return any(normalize_text(visit.get(field)) == identity for field in fields)


def _sort_recent(visits: list[dict[str, Any]]) -> list[dict[str, Any]]:
    dated_visits = [
        (visit, _parse_date(first_value(visit, _DATE_FIELDS)), index)
        for index, visit in enumerate(visits)
    ]

    if not any(parsed_date for _, parsed_date, _ in dated_visits):
        return list(reversed(visits))

    dated_visits.sort(
        key=lambda item: (
            item[1] is not None,
            item[1] or float("-inf"),
            item[2],
        ),
        reverse=True,
    )
    return [visit for visit, _, _ in dated_visits]


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
