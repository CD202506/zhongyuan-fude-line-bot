from typing import Any

from permission_service import is_yes, normalize_text


def find_shrine(
    query_text: str,
    shrines: list[dict[str, Any]],
    allow_internal: bool,
) -> dict[str, Any] | None:
    query = normalize_text(query_text)

    if not query:
        return None

    searchable_shrines = []

    for shrine in shrines:
        public_visible = is_yes(shrine.get("public_visible"))
        internal_only = is_yes(shrine.get("internal_only"))

        if public_visible:
            searchable_shrines.append(shrine)
            continue

        if allow_internal and internal_only:
            searchable_shrines.append(shrine)

    for shrine in searchable_shrines:
        if normalize_text(shrine.get("name")) == query:
            return shrine

    for shrine in searchable_shrines:
        if query in normalize_text(shrine.get("alias")):
            return shrine

    for shrine in searchable_shrines:
        if query in normalize_text(shrine.get("name")):
            return shrine

    return None
