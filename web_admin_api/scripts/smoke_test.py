from __future__ import annotations

import json
from urllib.parse import urlencode
from urllib.error import HTTPError
from urllib.request import Request, urlopen


BASE_URL = "http://127.0.0.1:8000"


def request_json(method: str, path: str, payload: dict | None = None) -> object:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    request = Request(
        f"{BASE_URL}{path}",
        data=data,
        method=method,
        headers={"Content-Type": "application/json"},
    )
    try:
        with urlopen(request, timeout=10) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except HTTPError as error:
        detail = error.read().decode("utf-8")
        raise RuntimeError(f"{method} {path} failed: {error.code} {detail}") from error


def main() -> None:
    health = request_json("GET", "/api/health")
    assert isinstance(health, dict)
    assert health["status"] == "ok"

    modules = request_json("GET", "/api/modules")
    assert isinstance(modules, list)
    assert len(modules) >= 10

    created = request_json(
        "POST",
        "/api/records",
        {
            "module_key": "temple-affairs",
            "title": "測試廟務 A",
            "summary": "本機 smoke test 建立的示範資料。",
            "status": "active",
            "responsible": "測試人員",
            "category": "廟務測試",
            "fields_json": {"note": "safe local test"},
            "tags_json": ["smoke-test"],
            "actor_role": "admin",
            "actor_name": "local-smoke-test",
        },
    )
    assert isinstance(created, dict)
    record_id = created["id"]

    query = urlencode({"module_key": "temple-affairs", "q": "測試"})
    listed = request_json("GET", f"/api/records?{query}")
    assert isinstance(listed, list)
    assert any(item["id"] == record_id for item in listed)

    fetched = request_json("GET", f"/api/records/{record_id}")
    assert isinstance(fetched, dict)
    assert fetched["title"] == "測試廟務 A"

    updated = request_json(
        "PATCH",
        f"/api/records/{record_id}",
        {
            "summary": "本機 smoke test 更新後的示範資料。",
            "actor_role": "admin",
            "actor_name": "local-smoke-test",
        },
    )
    assert isinstance(updated, dict)
    assert updated["summary"] == "本機 smoke test 更新後的示範資料。"

    archived = request_json("POST", f"/api/records/{record_id}/archive", {"actor_role": "admin", "actor_name": "local-smoke-test"})
    assert isinstance(archived, dict)
    assert archived["is_archived"] is True

    restored = request_json(
        "POST",
        f"/api/records/{record_id}/restore",
        {"status": "active", "actor_role": "admin", "actor_name": "local-smoke-test"},
    )
    assert isinstance(restored, dict)
    assert restored["is_archived"] is False

    audit_events = request_json("GET", f"/api/records/{record_id}/audit-events")
    assert isinstance(audit_events, list)
    assert {event["action"] for event in audit_events} >= {"create", "update", "archive", "restore"}

    print("web_admin_api smoke test passed")


if __name__ == "__main__":
    main()
