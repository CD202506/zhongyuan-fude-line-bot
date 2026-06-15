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

    if text == "查公告":
        return Command("announcement_placeholder")

    visit_query = _strip_prefix(text, ("查來訪", "來訪"))
    if visit_query is not None:
        return Command(
            "visit" if visit_query else "unknown",
            visit_query,
        )

    shrine_query = _strip_prefix(text, ("查友宮", "友宮"))
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
