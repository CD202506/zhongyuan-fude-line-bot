"""Render-shell operator only. Never prints codes, identities, keys or payloads."""

import argparse
import hmac
import json
import os
import secrets
import tempfile
import time
import uuid
from pathlib import Path

from identity_capture import ROOT, Capture, durable_write
from identity_capture_store import SecretStore
from webhook_security import hardened_off_settings

CONSENT = "EXTERNAL-01/consent/2026-10-01T12:50+08:00"
CONTROL = "zyf-line-capture-control"
CANDIDATE = "zyf-line-capture-external-01"


def guard():
    settings = hardened_off_settings()
    if not os.path.ismount(ROOT.parent):
        raise RuntimeError("persistent_mount_required")
    ROOT.mkdir(mode=0o700, exist_ok=True)
    return settings


def prepare():
    settings = guard()
    path = ROOT / "session.json"
    if path.exists():
        raise RuntimeError("existing_session_requires_review")
    # Read-only bot info confirms webhook destination using existing credential in memory.
    import httpx

    with httpx.Client(timeout=5, follow_redirects=False, trust_env=False) as client:
        response = client.get(
            "https://api.line.me/v2/bot/info",
            headers={
                "Authorization": "Bearer " + os.environ["LINE_CHANNEL_ACCESS_TOKEN"]
            },
        )
    if response.status_code != 200:
        raise RuntimeError("bot_scope_unavailable")
    destination = response.json()["userId"]
    if settings.destination and settings.destination != destination:
        raise RuntimeError("scope_conflict")
    identity_key = settings.identity_key or secrets.token_bytes(32)
    if len(identity_key) < 32:
        raise RuntimeError("identity_key_invalid")
    channel = settings.channel_reference or ("line-oa:" + destination)
    control = SecretStore().get(CONTROL)
    message = control["verification_message"]
    session = control["session"]
    import re

    if (
        control.get("tester") != "EXTERNAL-01"
        or not re.fullmatch(r"[a-f0-9]{32}", session)
        or not isinstance(message, str)
        or not re.fullmatch(r"身份確認 [A-Za-z0-9_-]{32,64}", message)
        or not 0 <= time.time() - control["created_at"] <= 900
    ):
        raise RuntimeError("control_invalid_or_expired")
    cfg = dict(
        session=session,
        enabled=False,
        starts=0,
        expires=0,
        prepared=control["created_at"],
        channel=channel,
        destination=destination,
        identity_key=identity_key.hex(),
        key_version="capture-v1-" + session,
        code_digest=hmac.digest(
            identity_key, ("code\0" + message).encode(), "sha256"
        ).hex(),
        consent_reference=CONSENT,
        candidate_secret=CANDIDATE,
    )
    durable_write(path, cfg, exclusive=True)
    return {"prepared": True, "capture_enabled": False, "code_location": CONTROL}


def status():
    guard()
    p = ROOT / "session.json"
    if not p.exists():
        return {
            "capture_enabled": False,
            "state": "not_prepared",
            "allowlist_candidate_ready": False,
        }
    c = json.loads(p.read_text())
    claim = ROOT / (c["session"] + ".claim")
    done = ROOT / (c["session"] + ".done")
    enabled = (
        c["enabled"]
        and c["starts"] <= time.time() < c["expires"]
        and not claim.exists()
    )
    if done.exists():
        e = json.loads(claim.read_text())
        return {
            "tester": "EXTERNAL-01",
            "pseudonymous_reference": e["reference"],
            "capture_timestamp": e["captured_at"],
            "consent_reference": e["consent_reference"],
            "allowlist_candidate_ready": True,
            "capture_enabled": False,
        }
    return {
        "capture_enabled": enabled,
        "state": "unknown_outcome" if claim.exists() else "prepared",
        "allowlist_candidate_ready": False,
    }


def arm():
    guard()
    p = ROOT / "session.json"
    c = json.loads(p.read_text())
    if (
        (ROOT / (c["session"] + ".claim")).exists()
        or c["starts"] != 0
        or time.time() - c["prepared"] > 900
    ):
        raise RuntimeError("session_not_armable")
    # Validate secure code handoff linkage without printing it.
    control = SecretStore().get(CONTROL)
    digest = hmac.digest(
        bytes.fromhex(c["identity_key"]),
        ("code\0" + control["verification_message"]).encode(),
        "sha256",
    ).hex()
    if control["session"] != c["session"] or not hmac.compare_digest(
        digest, c["code_digest"]
    ):
        raise RuntimeError("control_mismatch")
    now = time.time()
    c.update(enabled=True, starts=now, expires=now + 300)
    durable_write(p, c)
    return {"capture_enabled": True, "ttl_seconds": 300}


def close():
    guard()
    p = ROOT / "session.json"
    if p.exists():
        c = json.loads(p.read_text())
        c["enabled"] = False
        durable_write(p, c)
    return {"capture_enabled": False}


def reconcile():
    guard()
    c = json.loads((ROOT / "session.json").read_text())
    claim = json.loads((ROOT / (c["session"] + ".claim")).read_text())
    value = SecretStore().get(CANDIDATE)
    if not hmac.compare_digest(value["fingerprint"], claim["fingerprint"]):
        raise RuntimeError("reconciliation_mismatch")
    # Recompute the keyed source binding, never display the subject.
    from webhook_security import private_reference

    expected = private_reference(
        bytes.fromhex(c["identity_key"]),
        "identity:" + c["channel"],
        value["provider_subject"],
    )
    if not hmac.compare_digest(expected, value["identity_reference"]):
        raise RuntimeError("reconciliation_mismatch")
    done = ROOT / (c["session"] + ".done")
    if not done.exists():
        durable_write(done, {"completed": True}, exclusive=True)
    close()
    return status()


def synthetic():
    guard()
    # Real Render->Secret Manager path, entirely fictional data and temporary metadata.
    from webhook_security import WebhookSettings

    store = SecretStore()
    with tempfile.TemporaryDirectory(prefix="capture-synthetic-") as temp:
        root = Path(temp)
        now = time.time()
        key = secrets.token_bytes(32)
        text = "身份確認 " + secrets.token_urlsafe(24)
        cfg = dict(
            session=uuid.uuid4().hex,
            enabled=True,
            starts=now - 1,
            expires=now + 60,
            channel="synthetic",
            destination="synthetic",
            identity_key=key.hex(),
            code_digest=hmac.digest(key, ("code\0" + text).encode(), "sha256").hex(),
            consent_reference="SYNTHETIC",
            key_version="synthetic",
            candidate_secret="zyf-line-capture-synthetic",
        )
        durable_write(root / "session.json", cfg)
        event = dict(
            type="message",
            webhookEventId="synthetic-" + uuid.uuid4().hex,
            timestamp=int(now * 1000),
            source={"type": "user", "userId": "SYNTHETIC-NOT-A-PERSON"},
            message={"type": "text", "id": "synthetic-message", "text": text},
        )
        capture = Capture(root, store)
        capture.process(event, "synthetic", WebhookSettings(b"synthetic"))
        capture.process(event, "synthetic", WebhookSettings(b"synthetic"))
        value = store.get("zyf-line-capture-synthetic")
        assert value["event_reference"] == event["webhookEventId"]
        assert not value["pilot_eligible"]
        assert (root / (cfg["session"] + ".done")).exists()
    return {
        "synthetic_secure_store": "PASS",
        "real_capture_enabled": status()["capture_enabled"],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "action",
        choices=["prepare", "arm", "status", "close", "reconcile", "synthetic"],
    )
    args = parser.parse_args()
    try:
        print(json.dumps(globals()[args.action](), sort_keys=True))
    except Exception:
        print(
            json.dumps(
                {"result": "FAIL_CLOSED", "reason": "capture_operator_check_failed"}
            )
        )
        raise SystemExit(1) from None


if __name__ == "__main__":
    main()
