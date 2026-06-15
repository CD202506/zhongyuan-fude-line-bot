import json
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import gspread
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Zhongyuan Fude LINE Bot",
    version="0.1.9",
)

LINE_REPLY_API_URL = "https://api.line.me/v2/bot/message/reply"
TAIPEI_TZ = timezone(timedelta(hours=8))


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "zhongyuan-fude-line-bot",
        "version": "0.1.9",
    }


def now_taipei_iso() -> str:
    return datetime.now(TAIPEI_TZ).isoformat(timespec="seconds")


def get_google_sheet_client() -> gspread.Client:
    raw_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")

    if not raw_json:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON is not set")

    try:
        service_account_info = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON") from exc

    return gspread.service_account_from_dict(service_account_info)


def get_spreadsheet() -> gspread.Spreadsheet:
    sheet_id = os.getenv("GOOGLE_SHEET_ID")

    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is not set")

    client = get_google_sheet_client()
    return client.open_by_key(sheet_id)


def read_sheet_records(sheet_name: str) -> list[dict[str, Any]]:
    spreadsheet = get_spreadsheet()
    worksheet = spreadsheet.worksheet(sheet_name)

    return worksheet.get_all_records()


def append_sheet_row(sheet_name: str, row_values: list[Any]) -> None:
    spreadsheet = get_spreadsheet()
    worksheet = spreadsheet.worksheet(sheet_name)
    worksheet.append_row(row_values, value_input_option="USER_ENTERED")


def append_sheet_record_by_headers(sheet_name: str, record: dict[str, Any]) -> None:
    """
    Append a row by matching record keys to the sheet's header row.

    This avoids column misalignment when Google Sheets column order differs
    from the code's assumed order.
    """
    spreadsheet = get_spreadsheet()
    worksheet = spreadsheet.worksheet(sheet_name)

    headers = worksheet.row_values(1)
    row_values = [record.get(header, "") for header in headers]

    worksheet.append_row(row_values, value_input_option="USER_ENTERED")


@app.get("/debug/sheets")
async def debug_sheets(token: str | None = None):
    """
    Read non-sensitive sheet metadata when explicitly enabled.
    """
    debug_enabled = normalize_text(os.getenv("ENABLE_DEBUG_ENDPOINT")).lower() == "true"

    if not debug_enabled:
        return JSONResponse(
            status_code=404,
            content={
                "status": "disabled",
                "message": "Debug endpoint is not enabled.",
            },
        )

    debug_token = normalize_text(os.getenv("DEBUG_TOKEN"))

    if debug_token and (
        not token or not secrets.compare_digest(token, debug_token)
    ):
        return JSONResponse(
            status_code=403,
            content={
                "status": "forbidden",
                "message": "A valid debug token is required.",
            },
        )

    try:
        shrines = read_sheet_records("shrines")
        members = read_sheet_records("members")

        shrine_names = [row.get("name", "") for row in shrines[:3]]
        member_names = [row.get("name", "") for row in members[:3]]

        return {
            "status": "ok",
            "sheets": {
                "shrines": {
                    "record_count": len(shrines),
                    "headers": list(shrines[0].keys()) if shrines else [],
                    "sample_names": shrine_names,
                },
                "members": {
                    "record_count": len(members),
                    "headers": list(members[0].keys()) if members else [],
                    "sample_names": member_names,
                },
            },
        }

    except Exception as exc:
        print("debug_sheets error:", str(exc))

        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Unable to read sheet metadata.",
            },
        )


def normalize_text(value: Any) -> str:
    return str(value or "").strip()


def is_yes(value: Any) -> bool:
    return normalize_text(value).lower() in {"yes", "y", "true", "1", "是"}


def find_member_by_line_uid(
    line_user_id: str | None,
    members: list[dict[str, Any]],
) -> dict[str, Any] | None:
    if not line_user_id:
        return None

    for member in members:
        if normalize_text(member.get("line_uid")) == normalize_text(line_user_id):
            return member

    return None


def can_view_internal_shrine(member: dict[str, Any] | None) -> bool:
    if not member:
        return False

    return (
        is_yes(member.get("active"))
        and is_yes(member.get("can_view_internal_shrine"))
    )


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

    # 1. name 完全相等
    for shrine in searchable_shrines:
        name = normalize_text(shrine.get("name"))
        if name == query:
            return shrine

    # 2. alias contains query
    for shrine in searchable_shrines:
        alias = normalize_text(shrine.get("alias"))
        if query in alias:
            return shrine

    # 3. name contains query
    for shrine in searchable_shrines:
        name = normalize_text(shrine.get("name"))
        if query in name:
            return shrine

    return None


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


def append_line_query_log(
    *,
    line_user_id: str | None,
    member: dict[str, Any] | None,
    query_text: str,
    shrine: dict[str, Any] | None,
    reply_type: str,
    result_status: str,
    error_message: str = "",
) -> None:
    """
    Write one LINE query log record.

    The actual write uses header-based mapping, so it works with the current
    V2 sheet column order:
    log_id, query_datetime, line_uid, member_id, query_text, query_type,
    target_sheet, matched_record_id, matched_record_name, result_status,
    reply_type, ...
    """
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
        "query_type": "shrine",
        "target_sheet": "shrines",
        "matched_record_id": normalize_text(shrine.get("shrine_id")) if shrine else "",
        "matched_record_name": normalize_text(shrine.get("name")) if shrine else "",
        "matched_shrine_id": normalize_text(shrine.get("shrine_id")) if shrine else "",
        "matched_shrine_name": normalize_text(shrine.get("name")) if shrine else "",
        "reply_type": reply_type,
        "reply_mode": reply_type,
        "reply_token_used": "yes",
        "source_type": "user_message",
        "scenario_version": "Python_Render_V0.1.9",
        "result_status": result_status,
        "error_message": error_message,
        "created_at": timestamp,
    }

    append_sheet_record_by_headers("line_query_logs", record)


def build_shrine_query_reply(
    query_text: str,
    line_user_id: str | None,
) -> tuple[str, dict[str, Any]]:
    shrines = read_sheet_records("shrines")
    members = read_sheet_records("members")

    member = find_member_by_line_uid(line_user_id, members)
    allow_internal = can_view_internal_shrine(member)

    print("member_found:", bool(member))
    print("allow_internal:", allow_internal)

    shrine = find_shrine(query_text, shrines, allow_internal=allow_internal)

    if not shrine:
        return build_not_found_reply(query_text), {
            "member": member,
            "shrine": None,
            "reply_type": "not_found",
            "result_status": "not_found",
            "error_message": "",
        }

    if allow_internal:
        return build_internal_shrine_reply(shrine, member), {
            "member": member,
            "shrine": shrine,
            "reply_type": "internal",
            "result_status": "success",
            "error_message": "",
        }

    return build_public_shrine_reply(shrine), {
        "member": member,
        "shrine": shrine,
        "reply_type": "public",
        "result_status": "success",
        "error_message": "",
    }


async def reply_text_message(reply_token: str, text: str) -> None:
    channel_access_token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")

    if not channel_access_token:
        print("LINE_CHANNEL_ACCESS_TOKEN is not set. Skip reply.")
        return

    headers = {
        "Authorization": f"Bearer {channel_access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "replyToken": reply_token,
        "messages": [
            {
                "type": "text",
                "text": text,
            }
        ],
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.post(
            LINE_REPLY_API_URL,
            headers=headers,
            json=payload,
        )

    print("LINE reply status:", response.status_code)
    print("LINE reply response:", response.text)


@app.post("/webhook")
async def line_webhook(request: Request):
    """
    LINE Webhook entry point.

    V0.1.9 replies with public/internal shrine data and writes line_query_logs
    by matching Google Sheets headers.
    """
    try:
        body = await request.json()
        events = body.get("events", [])

        for event in events:
            event_type = event.get("type")
            reply_token = event.get("replyToken")
            source = event.get("source", {})
            user_id = source.get("userId")
            message = event.get("message", {})
            message_type = message.get("type")
            message_text = message.get("text")

            print("event_type:", event_type)
            print("user_id:", user_id)
            print("message_type:", message_type)
            print("message_text:", message_text)

            if (
                event_type == "message"
                and message_type == "text"
                and reply_token
                and message_text
            ):
                log_meta = {
                    "member": None,
                    "shrine": None,
                    "reply_type": "error",
                    "result_status": "error",
                    "error_message": "",
                }

                try:
                    reply_text, log_meta = build_shrine_query_reply(message_text, user_id)
                except Exception as exc:
                    error_message = str(exc)
                    print("build_shrine_query_reply error:", error_message)
                    reply_text = "系統暫時無法查詢友宮資料，請稍後再試。"
                    log_meta["error_message"] = error_message

                try:
                    append_line_query_log(
                        line_user_id=user_id,
                        member=log_meta.get("member"),
                        query_text=message_text,
                        shrine=log_meta.get("shrine"),
                        reply_type=normalize_text(log_meta.get("reply_type")) or "error",
                        result_status=normalize_text(log_meta.get("result_status")) or "error",
                        error_message=normalize_text(log_meta.get("error_message")),
                    )
                except Exception as exc:
                    print("append_line_query_log error:", str(exc))

                await reply_text_message(reply_token, reply_text)

        return JSONResponse(
            status_code=200,
            content={"status": "ok"},
        )

    except Exception as exc:
        print("Webhook error:", str(exc))

        return JSONResponse(
            status_code=200,
            content={"status": "ok", "note": "received but parse failed"},
        )
