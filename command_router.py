from dataclasses import dataclass

from permission_service import normalize_text


@dataclass(frozen=True)
class Command:
    command_type: str
    query_text: str = ""


def parse_command(message_text: str | None, message_type: str = "text") -> Command:
    if message_type != "text":
        return Command("unknown")

    text = " ".join(normalize_text(message_text).split())

    if not text:
        return Command("unknown")

    if text == "說明":
        return Command("help")

    if text in {"查紀錄", "查記錄", "最近查詢", "最近記錄", "查詢紀錄", "查詢記錄"}:
        return Command("log_recent")

    if text in {"補資料建議", "待補清單", "資料待辦"}:
        return Command("backfill_suggestions")

    if text in {"查無資料", "補資料", "待補資料"}:
        return Command("log_not_found")

    if text in {"查公告", "公告", "最新公告", "活動公告", "近期公告"}:
        return Command("announcement")

    visit_query = _strip_prefix(text, ("查來訪", "來訪", "查請帖", "請帖"))
    if visit_query is not None:
        return Command(
            "visit" if visit_query else "unknown",
            visit_query,
        )

    visit_query = _strip_suffix(text, ("來訪",))
    if visit_query is not None:
        return Command(
            "visit" if visit_query else "unknown",
            visit_query,
        )

    shrine_query = _strip_prefix(
        text,
        ("查友宮", "友宮", "查廟", "查宮廟", "友宮查詢"),
    )
    if shrine_query is not None:
        return Command("shrine" if shrine_query else "unknown", shrine_query)

    return Command("shrine", text)


def _strip_prefix(text: str, prefixes: tuple[str, ...]) -> str | None:
    for prefix in prefixes:
        if text == prefix:
            return ""

        if text.startswith(f"{prefix} "):
            return text[len(prefix):].strip()

    return None


def _strip_suffix(text: str, suffixes: tuple[str, ...]) -> str | None:
    for suffix in suffixes:
        if text == suffix:
            return ""

        if text.endswith(suffix):
            return text[:-len(suffix)].strip()

    return None
