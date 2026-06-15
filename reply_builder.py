from typing import Any

from announcement_service import get_announcement_display_fields
from permission_service import normalize_text
from shrine_visit_service import get_visit_display_fields


def safe_text(value: Any) -> str:
    return normalize_text(value)


def truncate_text(value: Any, max_length: int = 500) -> str:
    text = safe_text(value)

    if len(text) <= max_length:
        return text

    return f"{text[:max_length - 1].rstrip()}…"


def join_non_empty_sections(sections: list[str]) -> str:
    return "\n\n".join(section for section in sections if safe_text(section))


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
        f"友宮：{safe_text(shrine.get('name'))}",
    ]

    for index, visit in enumerate(visits, start=1):
        fields = get_visit_display_fields(visit)
        details = []

        if fields["date"]:
            details.append(f"日期：{truncate_text(fields['date'], 50)}")

        if fields["type"]:
            details.append(f"類型：{truncate_text(fields['type'], 100)}")

        if fields["activity"]:
            details.append(f"活動：{truncate_text(fields['activity'], 200)}")

        if fields["note"]:
            details.append(f"備註：{truncate_text(fields['note'], 200)}")

        if details:
            lines = [f"{index}. {details[0]}"]
            lines.extend(f"   {detail}" for detail in details[1:])
            sections.append("\n".join(lines))
        else:
            sections.append(f"{index}. 尚無詳細內容")

    sections.append("詳細資料請至 V2 暫存表查看。")
    return join_non_empty_sections(sections)


def build_announcements_reply(
    announcements: list[dict[str, Any]],
) -> str:
    sections = ["📣 最新公告"]

    for index, announcement in enumerate(announcements, start=1):
        fields = get_announcement_display_fields(announcement)
        date_text = fields["date"]

        if fields["time"]:
            date_text = f"{date_text} {fields['time']}".strip()

        lines = [
            f"{index}. 標題：{truncate_text(fields['title'], 150) or '未命名公告'}"
        ]

        if date_text:
            lines.append(f"   日期：{truncate_text(date_text, 100)}")

        if fields["location"]:
            lines.append(f"   地點：{truncate_text(fields['location'], 150)}")

        if fields["body"]:
            lines.append(f"   說明：{truncate_text(fields['body'], 300)}")

        sections.append("\n".join(lines))

    return join_non_empty_sections(sections)


def build_public_shrine_reply(shrine: dict[str, Any]) -> str:
    name = truncate_text(shrine.get("name"), 150)
    main_god = truncate_text(shrine.get("main_god"), 150)
    public_summary = truncate_text(shrine.get("public_summary"), 600)
    public_notice = truncate_text(shrine.get("public_notice"), 400)
    identity_lines = []

    if name:
        identity_lines.append(f"廟名：{name}")

    if main_god:
        identity_lines.append(f"主祀神明：{main_god}")

    sections = ["🏮 友宮公開資料", "\n".join(identity_lines)]

    if public_summary:
        sections.append(f"公開摘要：\n{public_summary}")

    if public_notice:
        sections.append(f"公開提醒：\n{public_notice}")

    return join_non_empty_sections(sections)


def build_internal_shrine_reply(
    shrine: dict[str, Any],
    member: dict[str, Any] | None,
) -> str:
    name = truncate_text(shrine.get("name"), 150)
    main_god = truncate_text(shrine.get("main_god"), 150)
    public_summary = truncate_text(shrine.get("public_summary"), 600)
    cultural_taboos = truncate_text(shrine.get("cultural_taboos"), 400)
    history_context = truncate_text(shrine.get("history_context"), 500)
    internal_note = truncate_text(shrine.get("internal_note"), 500)
    member_name = truncate_text(member.get("name"), 100) if member else ""
    identity_lines = []

    if name:
        identity_lines.append(f"廟名：{name}")

    if main_god:
        identity_lines.append(f"主祀神明：{main_god}")

    sections = [
        "🏮 友宮資料查詢結果",
        "\n".join(identity_lines),
        f"公開摘要：\n{public_summary or '尚未建立公開摘要。'}",
    ]

    if cultural_taboos:
        sections.append(f"內部提醒：\n{cultural_taboos}")

    if history_context:
        sections.append(f"交誼背景：\n{history_context}")

    if internal_note:
        sections.append(f"內部備註：\n{internal_note}")

    if member_name:
        sections.append(f"查詢身分：{member_name}")

    return join_non_empty_sections(sections)


def build_not_found_reply(query_text: str) -> str:
    query = truncate_text(query_text, 100)

    return (
        "🙏 目前查無友宮資料\n\n"
        f"您輸入的是：{query}\n\n"
        "請確認是否輸入完整廟名，例如：\n"
        "白沙屯拱天宮、北港朝天宮。\n\n"
        "若資料尚未建立，請通知廟方人員補充。"
    )
