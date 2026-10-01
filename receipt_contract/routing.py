"""Isolated local Mode B integration. Production composition deliberately absent."""

import asyncio
import logging
from time import monotonic
from dataclasses import replace

from pilot_relay import normalize
from webhook_security import IngressError

from .contract import Envelope
from .journal import EffectTracker

logger = logging.getLogger("line_ingress")


class ReceiptRouter:
    def __init__(
        self, journal, transport, organization, clock, timeout=1, synthetic=False
    ):
        if not 0 < timeout <= 3:
            raise ValueError("invalid_timeout")
        self.journal, self.transport = journal, transport
        self.organization, self.clock, self.timeout = organization, clock, timeout
        self.synthetic = synthetic

    async def process(self, events, settings, legacy):
        if not settings.pilot_enabled or not settings.pilot_allowlist:
            self.journal.set_enabled(False)
        settings.pilot_ready()
        failed = False
        relay_deadline = monotonic() + 3
        for event in events:
            try:
                if self.synthetic and (
                    settings.channel_reference != "synthetic-line-preparation"
                    or not event.get("webhookEventId", "").startswith("synthetic-")
                    or not event.get("source", {})
                    .get("userId", "")
                    .startswith("SYNTHETIC-")
                    or not event.get("message", {})
                    .get("text", "")
                    .startswith("SYNTHETIC:")
                ):
                    raise IngressError(403, "synthetic_fixture_required")
                # Stable namespace/key MUST remain configured during OFF and roster removal.
                if len(settings.identity_key) < 32 or not settings.channel_reference:
                    raise IngressError(503, "journal_identity_unconfigured")
                # Normalize without pilot-specific filtering for owner lookup first.
                item = normalize(
                    event, replace(settings, pilot_allowlist=frozenset()), self.clock()
                )
                source = event.get("source", {})
                candidate = (
                    settings.pilot_enabled
                    and source.get("type") == "user"
                    and source.get("userId") in settings.pilot_allowlist
                )
                row = self.journal.reserve(item, candidate)
                if row["owner"] == "v2":
                    if row["state"] == "durably_accepted":
                        continue
                    # Reserved/ambiguous handoff stays held even after OFF: never blind V1 fallback.
                    normalized = normalize(
                        event,
                        replace(
                            settings, pilot_allowlist=frozenset({source.get("userId")})
                        ),
                        self.clock(),
                    )
                    envelope = normalized["envelope"]
                    if envelope is None:
                        raise IngressError(503, "unsupported_pilot_event")
                    wire = Envelope.parse(
                        {
                            "organization": self.organization,
                            "channel": settings.channel_reference,
                            "provider": "synthetic" if self.synthetic else "line",
                            "event_reference": envelope["provider_event_reference"],
                            "message_reference": envelope["provider_message_reference"],
                            "identity_reference": envelope[
                                "external_identity_reference"
                            ],
                            "event_timestamp": envelope["event_timestamp"],
                            "event_type": envelope["event_type"],
                            "message_type": envelope["message_type"],
                            "text": envelope["text"],
                        }
                    )
                    remaining = relay_deadline - monotonic()
                    if remaining <= 0:
                        raise IngressError(503, "relay_batch_budget_exhausted")
                    self.journal.relay_attempt(row["event_key"])
                    try:
                        receipt = await asyncio.wait_for(
                            self.transport.accept(wire), min(self.timeout, remaining)
                        )
                    except BaseException as error:
                        self.journal.relay_unknown(row["event_key"])
                        if getattr(error, "code", None) == "relay_auth_rejected":
                            self.journal.auth_failed(row["event_key"])
                        raise
                    # An authenticated adapter must validate its response before returning an ID.
                    from uuid import UUID

                    UUID(receipt)
                    self.journal.accepted(row["event_key"], receipt)
                    continue
                state, lease = self.journal.claim(row["event_key"], self.clock())
                if state == "completed":
                    continue
                if lease is None:
                    raise IngressError(503, "legacy_review_or_inflight")
                try:
                    await legacy(
                        event, EffectTracker(self.journal, row["event_key"], lease)
                    )
                except Exception:
                    self.journal.finish(row["event_key"], lease, False)
                    raise
                else:
                    self.journal.finish(row["event_key"], lease, True)
            except Exception as exc:
                if getattr(exc, "code", None) == "relay_auth_rejected":
                    logger.warning("relay_auth_failed")
                # Never serialize payload, user identity or transport exception.
                logger.warning("receipt_event_unresolved")
                failed = True
        if failed:
            raise IngressError(503, "receipt_batch_unresolved")
