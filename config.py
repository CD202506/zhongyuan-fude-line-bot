import os
from datetime import timedelta, timezone


APP_VERSION = "0.3.1"
SERVICE_NAME = "zhongyuan-fude-line-bot"
LINE_REPLY_API_URL = "https://api.line.me/v2/bot/message/reply"
TAIPEI_TZ = timezone(timedelta(hours=8))


def get_debug_token() -> str:
    return os.getenv("DEBUG_TOKEN", "").strip()


def is_debug_endpoint_enabled() -> bool:
    return os.getenv("ENABLE_DEBUG_ENDPOINT", "").strip().lower() == "true"


def get_sheets_cache_ttl_seconds() -> float:
    raw_ttl = os.getenv("SHEETS_CACHE_TTL_SECONDS", "60").strip()

    try:
        return max(0.0, float(raw_ttl))
    except ValueError:
        return 60.0
