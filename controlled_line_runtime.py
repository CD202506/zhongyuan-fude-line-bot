"""Opt-in production composition. Default OFF profile is unchanged."""
import json
import os
import time
from dataclasses import replace

from identity_capture import ROOT
from identity_capture_store import SecretStore
from receipt_contract.journal import LegacyJournal
from receipt_contract.routing import ReceiptRouter
from receipt_contract.transport import ReceiptTransport
from relay_runtime import MOUNT
from webhook_security import IngressError, runtime_settings, private_reference


def controlled_settings():
    settings = runtime_settings()
    # Stable pseudonym namespace must survive OFF and allowlist removal.
    config = json.loads((ROOT / "session.json").read_text())
    key = bytes.fromhex(config["identity_key"])
    if config.get("enabled") or len(key) < 32:
        raise IngressError(503, "capture_must_be_closed")
    settings = replace(settings, identity_key=key, channel_reference=config["channel"], destination=config["destination"])
    if not settings.pilot_enabled:
        if settings.pilot_allowlist or os.getenv("LINE_OUTBOUND_ENABLED", "false") != "false":
            raise IngressError(503, "off_configuration_required")
        return settings
    if (not os.path.ismount(MOUNT) or os.getenv("LINE_PATH_DEPLOYMENT_VERIFIED", "false") != "true"
        or not os.getenv("RECEIPT_ADMISSION_HMAC") or not os.getenv("RECEIPT_ADMISSION_KEY_ID")):
        raise IngressError(503, "pilot_configuration_incomplete")
    try:
        starts = float(os.environ["LINE_PILOT_STARTS"])
        expires = float(os.environ["LINE_PILOT_EXPIRES"])
    except (KeyError, ValueError):
        raise IngressError(503, "pilot_window_invalid") from None
    if not 0 < expires-starts <= 1800 or not starts <= time.time() < expires:
        # Window expiry routes new events V1; journal keeps already owned events V2.
        return replace(settings, pilot_enabled=False, pilot_allowlist=frozenset())
    candidate = SecretStore().get("zyf-line-capture-external-01")
    reference = private_reference(key, "identity:" + config["channel"], candidate["provider_subject"])
    if (candidate["channel"] != config["channel"] or reference != candidate["identity_reference"]
        or os.getenv("LINE_PILOT_IDENTITY_REFERENCE", "") != reference):
        raise IngressError(503, "candidate_scope_mismatch")
    settings = replace(settings, pilot_allowlist=frozenset({candidate["provider_subject"]}))
    settings.pilot_ready()
    return settings


class ControlledRuntime:
    def __init__(self, journal, transport, organization, health):
        self.journal, self.transport, self.organization, self.health = journal, transport, organization, health

    async def dispatch_real(self, events, settings, legacy):
        if settings.pilot_enabled:
            if not await self.health():
                # Do not dispatch a Pilot candidate to V1 on receipt outage.
                async def unavailable(event):
                    raise IngressError(503, "receipt_unavailable")
                transport = type("Unavailable", (), {"accept": staticmethod(unavailable)})()
            else:
                transport = self.transport
        else:
            transport = self.transport
        self.journal.set_enabled(settings.pilot_enabled and bool(settings.pilot_allowlist))
        await ReceiptRouter(self.journal, transport, self.organization, time.time, timeout=2).process(events, settings, legacy)


def compose(client):
    if not os.path.ismount(MOUNT):
        raise IngressError(503, "persistent_mount_required")
    origin = os.environ["RECEIPT_ADMISSION_URL"]
    if origin != "https://zhongyuan-fude-line-admission-5ektxaybca-de.a.run.app":
        raise IngressError(503, "approved_https_origin_required")
    transport = ReceiptTransport(client, os.environ["RECEIPT_ADMISSION_KEY_ID"], os.environ["RECEIPT_ADMISSION_HMAC"].encode(), time.time)
    async def health():
        try:
            response = await client.get("/ready", timeout=2, follow_redirects=False)
            return response.status_code == 200 and response.json().get("mode") == "controlled_line"
        except Exception:
            return False
    return ControlledRuntime(LegacyJournal(MOUNT / "line-owners.sqlite3"), transport, os.environ["RECEIPT_ORGANIZATION_ID"], health)
