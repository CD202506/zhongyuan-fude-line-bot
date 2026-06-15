import os
import re
import uuid
from datetime import datetime
from typing import Any

from config import APP_VERSION, TAIPEI_TZ
from permission_service import normalize_text
from sheets_client import append_sheet_record_by_headers


LINE_QUERY_LOG_SHEET = "line_query_logs"
LINE_QUERY_LOG_HEADERS = (
    "log_id",
    "query_datetime",
    "line_uid",
    "member_id",
    "query_text",
    "query_type",
    "target_sheet",
    "matched_record_id",
    "matched_record_name",
    "result_status",
    "reply_mode",
    "reply_token_used",
    "error_message",
    "source_type",
    "scenario_version",
    "note",
)


def now_taipei_iso() -> str:
    return datetime.now(TAIPEI_TZ).isoformat(timespec="seconds")


def append_line_query_log(
    *,
    line_user_id: str | None,
    member: dict[str, Any] | None,
    query_text: str,
    shrine: dict[str, Any] | None,
    reply_type: str,
    result_status: str,
    query_type: str = "shrine",
    target_sheet: str = "shrines",
    error_message: str = "",
) -> None:
    timestamp = now_taipei_iso()
    log_id = f"LQ-{uuid.uuid4().hex[:12]}"

    record = {
        "log_id": log_id,
        "query_datetime": timestamp,
        "timestamp": timestamp,
        "line_uid": normalize_text(line_user_id),
        "member_id": normalize_text(member.get("member_id")) if member else "",
        "member_name": normalize_text(member.get("name")) if member else "",
        "query_text": normalize_text(query_text),
        "query_type": query_type,
        "target_sheet": target_sheet,
        "matched_record_id": normalize_text(shrine.get("shrine_id")) if shrine else "",
        "matched_record_name": normalize_text(shrine.get("name")) if shrine else "",
        "matched_shrine_id": normalize_text(shrine.get("shrine_id")) if shrine else "",
        "matched_shrine_name": normalize_text(shrine.get("name")) if shrine else "",
        "reply_type": reply_type,
        "reply_mode": reply_type,
        "reply_token_used": "yes",
        "source_type": "user_message",
        "scenario_version": f"Python_Render_V{APP_VERSION}",
        "result_status": result_status,
        "error_message": error_message,
        "note": "",
        "created_at": timestamp,
    }

    append_sheet_record_by_headers(
        LINE_QUERY_LOG_SHEET,
        record,
        required_headers=LINE_QUERY_LOG_HEADERS,
    )
    print(
        "[query_log] append success: "
        f"sheet={LINE_QUERY_LOG_SHEET}, "
        f"log_id={log_id}, "
        f"query_type={query_type}, "
        f"result_status={result_status}"
    )


def safe_query_log_error(exc: Exception) -> str:
    message = normalize_text(exc) or exc.__class__.__name__

    for env_name in (
        "LINE_CHANNEL_ACCESS_TOKEN",
        "GOOGLE_SERVICE_ACCOUNT_JSON",
        "GOOGLE_SHEET_ID",
        "DEBUG_TOKEN",
    ):
        secret_value = os.getenv(env_name)

        if secret_value:
            message = message.replace(secret_value, f"<redacted:{env_name}>")

    message = re.sub(
        r'(?i)(private[_ -]?key)(["\']?\s*[:=]\s*)([^,\s}]+)',
        r"\1\2<redacted>",
        message,
    )
    return " ".join(message.split())[:500]
