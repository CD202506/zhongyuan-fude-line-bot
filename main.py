import json
import os
from typing import Any

import gspread
import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Zhongyuan Fude LINE Bot",
    version="0.1.4",
)

LINE_REPLY_API_URL = "https://api.line.me/v2/bot/message/reply"


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "zhongyuan-fude-line-bot",
        "version": "0.1.4",
    }


def get_google_sheet_client() -> gspread.Client:
    raw_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")

    if not raw_json:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON is not set")

    try:
        service_account_info = json.loads(raw_json)
    except json.JSONDecodeError as exc:
        raise RuntimeError("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON") from exc

    return gspread.service_account_from_dict(service_account_info)


def read_sheet_records(sheet_name: str) -> list[dict[str, Any]]:
    sheet_id = os.getenv("GOOGLE_SHEET_ID")

    if not sheet_id:
        raise RuntimeError("GOOGLE_SHEET_ID is not set")

    client = get_google_sheet_client()
    spreadsheet = client.open_by_key(sheet_id)
    worksheet = spreadsheet.worksheet(sheet_name)

    return worksheet.get_all_records()


@app.get("/debug/sheets")
async def debug_sheets():
    """
    Temporary debug endpoint.

    Reads the shrines sheet from the V2 temporary Google Sheet.
    This endpoint should be removed or protected after verification.
    """
    try:
        records = read_sheet_records("shrines")

        sample_names = []
        for row in records[:3]:
            sample_names.append(row.get("name", ""))

        headers = list(records[0].keys()) if records else []

        return {
            "status": "ok",
            "sheet": "shrines",
            "record_count": len(records),
            "headers": headers,
            "sample_names": sample_names,
        }

    except Exception as exc:
        print("debug_sheets error:", str(exc))

        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": str(exc),
            },
        )


def normalize_text(value: Any) -> str:
    return str(value or "").strip()


def is_yes(value: Any) -> bool:
    return normalize_text(value).lower() in {"yes", "y", "true", "1", "是"}


def find_public_shrine(query_text: str, shrines: list[dict[str, Any]]) -> dict[str, Any] | None:
    query = normalize_text(query_text)

    if not query:
        return None

    public_shrines = [
        shrine
        for shrine in shrines
        if is_yes(shrine.get("public_visible"))
    ]

    # 1. name 完全相等
    for shrine in public_shrines:
        name = normalize_text(shrine.get("name"))
        if name == query:
            return shrine

    # 2. alias contains query
    for shrine in public_shrines:
        alias = normalize_text(shrine.get("alias"))
        if query in alias:
            return shrine

    # 3. name contains query
    for shrine in public_shrines:
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


def build_not_found_reply(query_text: str) -> str:
    query = normalize_text(query_text)

    return (
        "🙏 目前查無友宮資料\n\n"
        f"您輸入的是：{query}\n\n"
        "請確認是否輸入完整廟名，例如：\n"
        "白沙屯拱天宮、北港朝天宮。\n\n"
        "若資料尚未建立，請通知廟方人員補充。"
    )


def build_shrine_query_reply(query_text: str) -> str:
    shrines = read_sheet_records("shrines")
    shrine = find_public_shrine(query_text, shrines)

    if not shrine:
        return build_not_found_reply(query_text)

    return build_public_shrine_reply(shrine)


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

    V0.1.4 reads LINE text messages, searches public shrine records,
    and replies with public shrine information or a not-found message.
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
                try:
                    reply_text = build_shrine_query_reply(message_text)
                except Exception as exc:
                    print("build_shrine_query_reply error:", str(exc))
                    reply_text = "系統暫時無法查詢友宮資料，請稍後再試。"

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