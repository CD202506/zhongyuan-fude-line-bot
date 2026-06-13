import os

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

app = FastAPI(
    title="Zhongyuan Fude LINE Bot",
    version="0.1.2",
)

LINE_REPLY_API_URL = "https://api.line.me/v2/bot/message/reply"


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "zhongyuan-fude-line-bot",
        "version": "0.1.2",
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

    V0.1.2 reads LINE text messages and replies with a fixed echo message.
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
                reply_text = f"收到：{message_text}"
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