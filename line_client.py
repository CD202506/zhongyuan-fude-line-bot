import os

import httpx

from config import LINE_REPLY_API_URL


async def reply_text_message(reply_token: str, text: str) -> None:
    channel_access_token = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")

    if not channel_access_token:
        raise RuntimeError("line_sender_unconfigured")

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
            response.raise_for_status()
    except httpx.HTTPError:
        # Do not print or propagate HTTP response body, request URL or headers.
        raise RuntimeError("line_reply_failed") from None
