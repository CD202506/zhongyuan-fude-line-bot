import secrets
from typing import Any

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from config import (
    APP_VERSION,
    SERVICE_NAME,
    get_debug_token,
    is_debug_endpoint_enabled,
)
from line_client import reply_text_message
from log_service import append_line_query_log
from permission_service import (
    can_view_internal_shrine,
    find_member_by_line_uid,
    normalize_text,
)
from reply_builder import (
    build_internal_shrine_reply,
    build_not_found_reply,
    build_public_shrine_reply,
)
from sheets_client import read_sheet_records
from shrine_search_service import find_shrine


app = FastAPI(
    title="Zhongyuan Fude LINE Bot",
    version=APP_VERSION,
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": SERVICE_NAME,
        "version": APP_VERSION,
    }


@app.get("/debug/sheets")
async def debug_sheets(token: str | None = None):
    if not is_debug_endpoint_enabled():
        return JSONResponse(
            status_code=404,
            content={
                "status": "disabled",
                "message": "Debug endpoint is not enabled.",
            },
        )

    debug_token = get_debug_token()

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

        return {
            "status": "ok",
            "sheets": {
                "shrines": build_sheet_summary(shrines),
                "members": build_sheet_summary(members),
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


def build_sheet_summary(records: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "record_count": len(records),
        "headers": list(records[0].keys()) if records else [],
        "sample_names": [row.get("name", "") for row in records[:3]],
    }


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


@app.post("/webhook")
async def line_webhook(request: Request):
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
                await handle_text_message(
                    reply_token=reply_token,
                    user_id=user_id,
                    message_text=message_text,
                )

        return JSONResponse(status_code=200, content={"status": "ok"})
    except Exception as exc:
        print("Webhook error:", str(exc))
        return JSONResponse(
            status_code=200,
            content={"status": "ok", "note": "received but parse failed"},
        )


async def handle_text_message(
    *,
    reply_token: str,
    user_id: str | None,
    message_text: str,
) -> None:
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
        await reply_text_message(reply_token, reply_text)
    except Exception as exc:
        print("reply_text_message error:", str(exc))

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
