from typing import Any

from permission_service import normalize_text


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
