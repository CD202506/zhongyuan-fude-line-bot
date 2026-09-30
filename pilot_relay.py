"""Explicitly injected local Mode B and relay worker; no real transport binding."""

import asyncio
import json
import logging
import time
from collections.abc import Awaitable, Callable
from typing import Protocol

from local_relay_store import LocalReceiptStore
from webhook_security import IngressError, WebhookSettings, private_reference

logger = logging.getLogger("line_ingress")
LegacyHandler = Callable[[dict], Awaitable[None]]


class RelayTransport(Protocol):
    async def accept_durably(self, envelope: dict) -> str:
        """Return exact relay_id only after authenticated durable acceptance.

        Real adapter/V2 endpoint intentionally absent. HTTP 200 alone is not this
        contract. Receiver must verify authentication, scope and fingerprint;
        atomically insert receipt/canonical source once before acknowledging.
        """
        ...


def normalize(event: dict, settings: WebhookSettings, now: float) -> dict:
    event_id = event.get("webhookEventId")
    if not isinstance(event_id, str) or not 1 <= len(event_id) <= 256:
        raise IngressError(400, "event_reference_required")
    source = event.get("source", {})
    user = source.get("userId")
    message = event.get("message", {})
    kind = event["type"]
    pilot = source.get("type") == "user" and user in settings.pilot_allowlist
    route = "legacy" if kind == "message" and event.get("replyToken") else "ignored"
    envelope = None
    message_id = message.get("id") if kind == "message" else None
    if message_id is not None and (
        not isinstance(message_id, str) or len(message_id) > 256
    ):
        raise IngressError(400, "invalid_message_reference")
    if kind == "message" and not message_id:
        raise IngressError(400, "message_reference_required")
    normalized = {
        "type": kind,
        "timestamp": event.get("timestamp"),
        "source": source,
        "message": message,
        "unsend": event.get("unsend"),
    }
    packed = json.dumps(normalized, sort_keys=True, ensure_ascii=False)
    event_fp = private_reference(settings.identity_key, "event-payload", packed)
    # Logical message fingerprint ignores event ID, redelivery/reply-token metadata
    # and transport timestamp; changing sender/content for one message conflicts.
    message_fp = (
        private_reference(
            settings.identity_key,
            "message-payload",
            json.dumps(
                {"source": source, "message": message},
                sort_keys=True,
                ensure_ascii=False,
            ),
        )
        if message_id
        else event_fp
    )
    if pilot:
        route = (
            "ignored"  # Pilot events never fall through to legacy automatic replies.
        )
        if kind in {"unfollow", "unsend"} or (
            kind == "message" and message.get("type") == "text"
        ):
            stamp = event.get("timestamp")
            if type(stamp) is not int or stamp < 0:
                raise IngressError(400, "invalid_timestamp")
            text = message.get("text") if kind == "message" else None
            if text is not None and (
                not text.strip() or len(text) > 2000 or "\0" in text
            ):
                raise IngressError(400, "unsupported_pilot_text")
            unsend = event.get("unsend", {})
            target = unsend.get("messageId") if isinstance(unsend, dict) else None
            if kind == "unsend" and (not isinstance(target, str) or not target):
                raise IngressError(400, "invalid_unsend")
            route = "pilot"
            envelope = {
                "schema": "line-relay.v1",
                "channel_reference": settings.channel_reference,
                "provider_event_reference": event_id,
                "provider_message_reference": message_id or target,
                "source_type": "user",
                "external_identity_reference": private_reference(
                    settings.identity_key,
                    "identity:" + settings.channel_reference,
                    user,
                ),
                "event_type": kind,
                "event_timestamp": stamp,
                "received_timestamp": int(now * 1000),
                "message_type": message.get("type") if kind == "message" else None,
                "text": text,
            }
    namespace = settings.channel_reference
    return {
        "event_key": private_reference(
            settings.identity_key, "event:" + namespace, event_id
        ),
        "message_key": private_reference(
            settings.identity_key, "message:" + namespace, message_id
        )
        if message_id
        else None,
        "event_fingerprint": event_fp,
        "fingerprint": message_fp,
        "route": route,
        "envelope": envelope,
    }


class LocalPilotRouter:
    """Local only: unresolved V1 side effects become unknown, never blind retry."""

    def __init__(
        self, store: LocalReceiptStore, clock: Callable[[], float] = time.time
    ):
        self.store = store
        self.clock = clock

    async def process(
        self, events: list[dict], settings: WebhookSettings, legacy: LegacyHandler
    ) -> None:
        settings.pilot_ready()
        now = self.clock()
        items = [normalize(event, settings, now) for event in events]
        receipts = self.store.prepare_batch(items, now)
        failed = False
        for event, row in zip(events, receipts):
            logger.info("event_route route=%s", row["route"])
            if row["route"] != "legacy":
                continue
            previous = self.store.begin_legacy(row["receipt"])
            if previous == "done":
                continue
            if previous != "pending":
                failed = (
                    True  # Includes a crash after reply but before receipt completion.
                )
                continue
            try:
                await legacy(event)
            except Exception:
                self.store.finish_legacy(row["receipt"], "unknown")
                logger.warning("legacy_outcome_unknown")
                failed = True
            else:
                self.store.finish_legacy(row["receipt"], "done")
        if failed:
            raise IngressError(503, "legacy_reconciliation_required")


class LocalRelayWorker:
    def __init__(
        self,
        store: LocalReceiptStore,
        transport: RelayTransport,
        enabled: Callable[[], bool],
        clock: Callable[[], float] = time.time,
        timeout: float = 1.0,
    ):
        if not 0 < timeout <= 2:
            raise ValueError("relay_timeout_must_be_bounded")
        self.store, self.transport, self.enabled = store, transport, enabled
        self.clock, self.timeout = clock, timeout

    async def once(self) -> str:
        if not self.enabled():
            return "disabled"
        job = self.store.claim(self.clock())
        if job is None:
            return "idle"
        if not self.enabled():
            self.store.complete(job, False, self.clock())
            return "disabled"
        try:
            envelope = json.loads(job["payload"])
            receipt = await asyncio.wait_for(
                self.transport.accept_durably(envelope), self.timeout
            )
            accepted = receipt == job["receipt"]
        except Exception:
            accepted = False
        applied = self.store.complete(job, accepted, self.clock())
        logger.info(
            "relay_result outcome=%s", "accepted" if accepted else "retry_or_review"
        )
        return (
            "stale" if not applied else "accepted" if accepted else "pending_or_blocked"
        )
