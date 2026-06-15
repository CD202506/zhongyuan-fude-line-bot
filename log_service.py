import uuid
from datetime import datetime
from typing import Any

from config import APP_VERSION, TAIPEI_TZ
from permission_service import normalize_text
from sheets_client import append_sheet_record_by_headers


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
        "created_at": timestamp,
    }

    append_sheet_record_by_headers("line_query_logs", record)
