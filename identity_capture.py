"""One-shot capture after signature verification; no config or I/O at import."""

import asyncio
import hmac
import json
import os
import re
import time
from pathlib import Path

from webhook_security import IngressError, private_reference

PREFIX = "身份確認 "
ROOT = Path("/var/data/line-journal/identity-capture")


def reserved(event):
    message = event.get("message", {})
    text = message.get("text", "")
    return (
        message.get("type") == "text"
        and isinstance(text, str)
        and (text.startswith(PREFIX) or text.startswith("身份確認測試"))
    )


def durable_write(path, value, exclusive=False):
    data = json.dumps(value, sort_keys=True).encode()
    target = path if exclusive else path.with_suffix(".tmp")
    flags = os.O_WRONLY | os.O_CREAT | (os.O_EXCL if exclusive else os.O_TRUNC)
    fd = os.open(target, flags, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(data)
        handle.flush()
        os.fsync(handle.fileno())
    if not exclusive:
        os.replace(target, path)
    if os.name != "nt":
        fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)


class Capture:
    def __init__(self, root, sink, clock=time.time):
        self.root, self.sink, self.clock = Path(root), sink, clock

    def process(self, event, destination, settings):
        # Reserved messages never reach legacy replies/logs, even disabled/expired.
        if not reserved(event):
            return False
        if settings.pilot_enabled or settings.pilot_allowlist:
            raise IngressError(503, "capture_requires_off")
        config_path = self.root / "session.json"
        if not config_path.exists():
            return True
        config = json.loads(config_path.read_text())
        session = config["session"]
        if not re.fullmatch(r"[a-f0-9]{32}", session):
            raise IngressError(503, "capture_configuration_invalid")
        claim = self.root / (session + ".claim")
        done = self.root / (session + ".done")
        key = bytes.fromhex(config["identity_key"])
        if len(key) < 32 or not config["channel"] or not config["destination"]:
            raise IngressError(503, "capture_configuration_invalid")
        if destination != config["destination"]:
            raise IngressError(403, "capture_scope_mismatch")
        text = event["message"]["text"]
        supplied = hmac.digest(key, ("code\0" + text).encode(), "sha256").hex()
        if not hmac.compare_digest(supplied, config["code_digest"]):
            return True
        source, message = event.get("source", {}), event.get("message", {})
        if event.get("type") != "message" or source.get("type") != "user":
            return True
        fields = [source.get("userId"), event.get("webhookEventId"), message.get("id")]
        if any(not isinstance(v, str) or not v or len(v) > 256 for v in fields):
            raise IngressError(400, "capture_invalid_event")
        subject, event_id, message_id = fields
        stamp = event.get("timestamp")
        if type(stamp) is not int or stamp < 0:
            raise IngressError(400, "capture_invalid_event")
        identity = private_reference(key, "identity:" + config["channel"], subject)
        fingerprint = private_reference(
            key,
            "capture-event",
            json.dumps(
                [config["channel"], subject, event_id, message_id, stamp],
                separators=(",", ":"),
            ),
        )
        if claim.exists():
            previous = json.loads(claim.read_text())
            if previous["fingerprint"] == fingerprint:
                if done.exists():
                    return True
                raise IngressError(503, "capture_outcome_unknown")
            # Code has already been consumed. Never replace the winner or fall through.
            return True
        now = self.clock()
        start, end = config["starts"], config["expires"]
        if not config["enabled"] or not (0 < end - start <= 300 and start <= now < end):
            return True
        if not (start * 1000 <= stamp <= now * 1000 + 5000):
            return True
        evidence = {
            "fingerprint": fingerprint,
            "reference": "ext-line-" + identity[:24],
            "captured_at": now,
            "consent_reference": config["consent_reference"],
        }
        try:
            durable_write(claim, evidence, exclusive=True)
        except FileExistsError:
            return self.process(event, destination, settings)
        # From here any exception leaves a permanent consumed/unknown claim.
        # The raw subject exists only in memory and the dedicated secure sink.
        payload = dict(
            evidence,
            tester="EXTERNAL-01",
            identity_reference=identity,
            provider_subject=subject,
            channel=config["channel"],
            event_reference=event_id,
            message_reference=message_id,
            event_timestamp=stamp,
            key_version=config["key_version"],
            pilot_eligible=False,
            pilot_enabled=False,
            outbound_enabled=False,
        )
        self.sink.put(config["candidate_secret"], payload)
        durable_write(done, {"completed": True}, exclusive=True)
        # Claim fences all other processes even if this final config write fails.
        config["enabled"] = False
        durable_write(config_path, config)
        return True


async def partition(events, destination, settings, capture):
    remaining, failed = [], False
    for event in events:
        if not reserved(event):
            remaining.append(event)
            continue
        try:
            await asyncio.wait_for(
                asyncio.to_thread(capture.process, event, destination, settings), 5
            )
        except Exception:
            # Never stringify provider/config/transport exceptions.
            failed = True
    return remaining, failed


def runtime_capture():
    from identity_capture_store import SecretStore

    # Missing mount/config means disabled; unrelated traffic never calls the store.
    return Capture(ROOT, SecretStore())
