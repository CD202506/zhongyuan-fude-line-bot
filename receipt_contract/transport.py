"""Bounded authenticated transport; caller supplies HTTPS client or synthetic ASGI client."""

import uuid

import httpx

from .contract import ContractError, packed, sign


class ReceiptTransport:
    def __init__(self, client, key_id, key, clock):
        if client.base_url.scheme != "https" or len(key) < 32:
            raise ValueError("secure_transport_required")
        if client.follow_redirects:
            raise ValueError("redirects_forbidden")
        self.client, self.key_id, self.key, self.clock = client, key_id, key, clock

    async def accept(self, event):
        raw = packed(event.as_dict()).encode()
        stamp, nonce = str(int(self.clock())), uuid.uuid4().hex
        headers = {
            "x-key-id": self.key_id,
            "x-timestamp": stamp,
            "x-nonce": nonce,
            "x-signature": sign(self.key, self.key_id, stamp, nonce, raw),
            "content-type": "application/json",
        }
        try:
            response = await self.client.post(
                "/internal/channel-events/admit",
                content=raw,
                headers=headers,
                timeout=3,
            )
        except httpx.HTTPError:
            raise ContractError("relay_transport_unknown", 503) from None
        if response.status_code in {401, 403}:
            raise ContractError("relay_auth_rejected", 503)
        if response.status_code != 200:
            raise ContractError("receipt_not_accepted", 503)
        if len(response.content) > 4096:
            raise ContractError("invalid_receipt_response", 503)
        try:
            data = response.json()
            if data["status"] != "durably_accepted":
                raise ValueError
            return str(uuid.UUID(data["receipt_id"]))
        except (ValueError, KeyError, TypeError):
            raise ContractError("invalid_receipt_response", 503) from None
