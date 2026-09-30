"""LINE ingress security. No configuration reads or I/O during import."""

import base64
import hashlib
import hmac
import json
import os
from dataclasses import dataclass, field
from typing import Any

MAX_BODY_BYTES = 1024 * 1024
MAX_EVENTS = 100


class IngressError(Exception):
    def __init__(self, status: int, code: str):
        super().__init__(code)
        self.status = status
        self.code = code


@dataclass(frozen=True)
class WebhookSettings:
    channel_secret: bytes = field(repr=False)
    pilot_enabled: bool = False
    pilot_allowlist: frozenset[str] = field(default_factory=frozenset, repr=False)
    channel_reference: str = ""
    destination: str = field(default="", repr=False)
    identity_key: bytes = field(default=b"", repr=False)

    def pilot_ready(self) -> None:
        if (
            self.pilot_enabled
            and self.pilot_allowlist
            and (
                len(self.pilot_allowlist) > 2
                or not self.channel_reference
                or not self.destination
                or len(self.identity_key) < 32
            )
        ):
            raise IngressError(503, "pilot_configuration_incomplete")


def runtime_settings() -> WebhookSettings:
    """Called at request boundary, never at import. No values logged."""
    flag = os.getenv("LINE_V2_PILOT_ENABLED", "false").strip().lower()
    if flag not in {"true", "false"}:
        raise IngressError(503, "invalid_pilot_flag")
    settings = WebhookSettings(
        channel_secret=os.getenv("LINE_CHANNEL_SECRET", "").encode(),
        pilot_enabled=flag == "true",
        pilot_allowlist=frozenset(
            value.strip()
            for value in os.getenv("LINE_V2_PILOT_ALLOWLIST", "").split(",")
            if value.strip()
        ),
        channel_reference=os.getenv("LINE_RELAY_CHANNEL_REFERENCE", ""),
        destination=os.getenv("LINE_WEBHOOK_DESTINATION", ""),
        identity_key=os.getenv("LINE_RELAY_IDENTITY_KEY", "").encode(),
    )
    settings.pilot_ready()
    return settings


def verify_signature(raw: bytes, signature: str | None, secret: bytes) -> None:
    if not secret:
        raise IngressError(503, "signature_verifier_unconfigured")
    if not signature or len(signature) != 44:
        raise IngressError(401, "invalid_signature")
    try:
        supplied = base64.b64decode(signature.encode("ascii"), validate=True)
    except (ValueError, UnicodeError):
        raise IngressError(401, "invalid_signature") from None
    expected = hmac.digest(secret, raw, "sha256")
    if not hmac.compare_digest(expected, supplied):
        raise IngressError(401, "invalid_signature")


def parse_verified_body(raw: bytes, settings: WebhookSettings) -> list[dict[str, Any]]:
    try:
        body = json.loads(raw)
    except (ValueError, UnicodeError, RecursionError):
        raise IngressError(400, "invalid_body") from None
    if not isinstance(body, dict) or not isinstance(body.get("events"), list):
        raise IngressError(400, "invalid_body")
    if settings.destination and body.get("destination") != settings.destination:
        raise IngressError(403, "wrong_destination")
    events = body["events"]
    if len(events) > MAX_EVENTS:
        raise IngressError(413, "too_many_events")
    for event in events:
        if not isinstance(event, dict) or not isinstance(event.get("type"), str):
            raise IngressError(400, "invalid_event")
        if not isinstance(event.get("source", {}), dict):
            raise IngressError(400, "invalid_event")
        if not isinstance(event.get("message", {}), dict):
            raise IngressError(400, "invalid_event")
        source = event.get("source", {})
        if source.get("userId") is not None and not isinstance(source["userId"], str):
            raise IngressError(400, "invalid_source")
        message = event.get("message", {})
        if message.get("type") == "text" and not isinstance(message.get("text"), str):
            raise IngressError(400, "invalid_text")
        if event.get("replyToken") is not None and not isinstance(
            event["replyToken"], str
        ):
            raise IngressError(400, "invalid_event")
    return events


def private_reference(key: bytes, namespace: str, value: str) -> str:
    return hmac.new(
        key, (namespace + "\0" + value).encode(), hashlib.sha256
    ).hexdigest()


def hardened_off_settings() -> WebhookSettings:
    """Production entry remains OFF; synthetic tests use explicit injection only."""
    settings = runtime_settings()
    if (
        settings.pilot_enabled
        or settings.pilot_allowlist
        or os.getenv("LINE_OUTBOUND_ENABLED", "false").strip().lower() != "false"
    ):
        raise IngressError(503, "hardened_off_required")
    return settings
