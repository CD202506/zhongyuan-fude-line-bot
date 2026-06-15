import os

import httpx

from config import LINE_REPLY_API_URL


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

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                LINE_REPLY_API_URL,
                headers=headers,
                json=payload,
            )
    except httpx.HTTPError as exc:
        print("LINE reply status: unavailable")
        print("LINE reply response:", str(exc))
        raise

    print("LINE reply status:", response.status_code)
    print("LINE reply response:", response.text)
