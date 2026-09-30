"""Explicit OFF-only production relay composition and synthetic operator entry point."""

import asyncio
import hashlib
import json
import os
import time
from pathlib import Path

import httpx

from receipt_contract.contract import ContractError, Envelope
from receipt_contract.transport import ReceiptTransport
from relay_journal import JournalError, RelayJournal

MOUNT = Path("/var/data/line-journal")


def runtime_journal():
    if not os.path.ismount(MOUNT):
        raise JournalError("persistent_mount_required")
    return RelayJournal(MOUNT / "relay-journal.sqlite3")


def synthetic_event(organization, reference):
    import re

    if not re.fullmatch(r"synthetic-[a-z0-9-]{1,80}", reference):
        raise JournalError("synthetic_reference_required")
    return Envelope.parse(
        dict(
            organization=organization,
            channel="synthetic-line-preparation",
            provider="synthetic",
            event_reference=reference,
            message_reference=reference,
            identity_reference=hashlib.sha256(b"SYNTHETIC: relay closeout").hexdigest(),
            event_timestamp=1000,
            event_type="message",
            message_type="text",
            text="SYNTHETIC: relay infrastructure closeout",
        )
    )


class RelayRuntime:
    def __init__(self, journal):
        self.journal = journal

    async def dispatch_real(self, events, settings, legacy):
        # This Gate has no ON state. Keep V1 independent of receipt and journal I/O.
        if settings.pilot_enabled or settings.pilot_allowlist:
            raise JournalError("real_pilot_forbidden")
        for event in events:
            await legacy(event)

    async def handoff(self, event, transport):
        if (
            event.provider != "synthetic"
            or event.channel != "synthetic-line-preparation"
            or not event.event_reference.startswith("synthetic-")
            or not (event.text or "").startswith("SYNTHETIC:")
        ):
            raise JournalError("real_relay_forbidden")
        key = self.journal.receive(event)
        previous = self.journal.inspect(key)
        if previous["state"] == "durable_accepted":
            return {
                "key": key,
                "state": previous["state"],
                "receipt_id": previous["receipt_id"],
                "duplicate": True,
            }
        lease = self.journal.claim(key)
        if lease is None:
            return {
                "key": key,
                "state": self.journal.inspect(key)["state"],
                "sent": False,
            }
        try:
            receipt = await asyncio.wait_for(transport.accept(event), timeout=4)
        except asyncio.TimeoutError:
            self.journal.finish(key, lease, "unknown_outcome", reason="timeout")
        except ContractError as error:
            if error.code == "relay_auth_rejected":
                state, reason = "terminal_failure", "auth_rejected"
            elif error.code == "relay_connect_unavailable":
                state, reason = "retryable_failure", "unavailable"
            elif error.code == "receipt_not_accepted":
                state, reason = "retryable_failure", "unavailable"
            else:
                state, reason = "unknown_outcome", "transport_unknown"
            self.journal.finish(key, lease, state, reason=reason)
        except Exception:
            self.journal.finish(
                key, lease, "unknown_outcome", reason="invalid_response"
            )
        else:
            self.journal.finish(key, lease, "durable_accepted", receipt_id=receipt)
        return self.journal.inspect(key)


async def send_synthetic(reference):
    from webhook_security import hardened_off_settings

    hardened_off_settings()  # Refuse unsafe production switches.
    journal = runtime_journal()
    url = os.environ["RECEIPT_ADMISSION_URL"]
    if url != "https://zhongyuan-fude-line-admission-5ektxaybca-de.a.run.app":
        raise JournalError("approved_https_origin_required")
    # Dedicated admission key only. Never use LINE or operator credentials.
    key = os.environ["RECEIPT_ADMISSION_HMAC"].encode()
    kid = os.environ["RECEIPT_ADMISSION_KEY_ID"]
    event = synthetic_event(os.environ["RECEIPT_ORGANIZATION_ID"], reference)
    async with httpx.AsyncClient(
        base_url=url, follow_redirects=False, timeout=3
    ) as client:
        return await RelayRuntime(journal).handoff(
            event, ReceiptTransport(client, kid, key, time.time)
        )


def main():
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "action",
        choices=[
            "inspect",
            "metrics",
            "send-synthetic",
            "retry",
            "reclaim",
            "resolve",
            "pause-pilot",
            "pause-outbound",
            "kill",
        ],
    )
    parser.add_argument("--reference")
    parser.add_argument("--key")
    parser.add_argument("--actor")
    parser.add_argument("--evidence")
    args = parser.parse_args()
    try:
        if args.action == "send-synthetic":
            result = asyncio.run(send_synthetic(args.reference))
        elif args.action in {"pause-pilot", "pause-outbound", "kill"}:
            from webhook_security import hardened_off_settings

            hardened_off_settings()
            result = {
                "pilot_enabled": False,
                "outbound_enabled": False,
                "real_relay_enabled": False,
                "mode": "immutable_off",
            }
        else:
            journal = runtime_journal()
            if args.action == "inspect":
                result = journal.inspect(args.key)
            elif args.action == "metrics":
                result = journal.metrics()
            else:
                journal.operate(args.key, args.action, args.actor, args.evidence)
                result = journal.inspect(args.key)
        print(json.dumps(result, sort_keys=True))
    except Exception as error:
        # Never serialize exception text or environment values.
        print(json.dumps({"result": "FAIL_CLOSED", "error_type": type(error).__name__}))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
