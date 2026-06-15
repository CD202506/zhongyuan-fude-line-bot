from typing import Any

from permission_service import normalize_text
from shrine_visit_service import get_visit_display_fields


def build_help_reply() -> str:
    return (
        "可用指令：\n"
        "白沙屯\n"
        "查友宮 白沙屯\n"
        "查來訪 白沙屯\n"
        "查公告"
    )


def build_unknown_command_reply() -> str:
    return "請輸入友宮名稱，例如：白沙屯，或輸入「說明」查看可用指令。"


def build_shrine_visits_reply(
    shrine: dict[str, Any],
    visits: list[dict[str, Any]],
) -> str:
    sections = [
        "🧾 友宮來訪紀錄",
        "",
        f"友宮：{normalize_text(shrine.get('name'))}",
    ]

    for index, visit in enumerate(visits, start=1):
        fields = get_visit_display_fields(visit)
        sections.extend(
            [
                "",
                f"{index}. 日期：{fields['date'] or '未填'}",
                f"   類型：{fields['type'] or '未填'}",
                f"   活動：{fields['activity'] or '未填'}",
                f"   備註：{fields['note'] or '未填'}",
            ]
        )

    sections.extend(["", "詳細資料請至 V2 暫存表查看。"])
    return "\n".join(sections)


def build_public_shrine_reply(shrine: dict[str, Any]) -> str:
    name = normalize_text(shrine.get("name"))
    main_god = normalize_text(shrine.get("main_god"))
    public_summary = normalize_text(shrine.get("public_summary"))
    public_notice = normalize_text(shrine.get("public_notice"))

    return (
        "🏮 友宮公開資料\n\n"
        f"廟名：{name}\n"
        f"主祀神明：{main_god}\n\n"
        "公開摘要：\n"
        f"{public_summary}\n\n"
        "公開提醒：\n"
        f"{public_notice}"
    )


def build_internal_shrine_reply(
    shrine: dict[str, Any],
    member: dict[str, Any] | None,
) -> str:
    name = normalize_text(shrine.get("name"))
    main_god = normalize_text(shrine.get("main_god"))
    public_summary = normalize_text(shrine.get("public_summary"))
    cultural_taboos = normalize_text(shrine.get("cultural_taboos"))
    history_context = normalize_text(shrine.get("history_context"))
    internal_note = normalize_text(shrine.get("internal_note"))
    member_name = normalize_text(member.get("name")) if member else ""

    sections = [
        "🏮 友宮資料查詢結果",
        "",
        f"廟名：{name}",
        f"主祀神明：{main_god}",
        "",
        "公開摘要：",
        public_summary or "尚未建立公開摘要。",
    ]

    if cultural_taboos:
        sections.extend(["", "內部提醒：", cultural_taboos])

    if history_context:
        sections.extend(["", "交誼背景：", history_context])

    if internal_note:
        sections.extend(["", "內部備註：", internal_note])

    if member_name:
        sections.extend(["", f"查詢身分：{member_name}"])

    return "\n".join(sections)


def build_not_found_reply(query_text: str) -> str:
    query = normalize_text(query_text)

    return (
        "🙏 目前查無友宮資料\n\n"
        f"您輸入的是：{query}\n\n"
        "請確認是否輸入完整廟名，例如：\n"
        "白沙屯拱天宮、北港朝天宮。\n\n"
        "若資料尚未建立，請通知廟方人員補充。"
    )
