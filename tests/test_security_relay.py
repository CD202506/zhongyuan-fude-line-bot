"""Synthetic-only tests. No LINE, Sheets, Render or V2 network access."""

import asyncio
import base64
import contextlib
import dataclasses
import hmac
import io
import json
import os
from pathlib import Path
import socket
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import main
from command_router import parse_command
from local_relay_store import LocalReceiptStore
from pilot_relay import LocalPilotRouter, LocalRelayWorker
from webhook_security import (
    WebhookSettings,
    runtime_settings,
    MAX_BODY_BYTES,
    verify_signature,
    IngressError,
)

SECRET = b"synthetic-test-signing-material-only"
IDENTITY_KEY = b"synthetic-local-correlation-key-000000"
PILOT = "SYNTHETIC-PILOT-ONE"
OTHER = "SYNTHETIC-LEGACY-ONE"
TEXT = "SYNTHETIC-PRIVATE-TEXT"
SETTINGS = WebhookSettings(
    SECRET,
    True,
    frozenset({PILOT}),
    "synthetic-channel",
    "synthetic-destination",
    IDENTITY_KEY,
)


def event(event_id="event-1", message_id="message-1", user=PILOT, text=TEXT):
    return {
        "webhookEventId": event_id,
        "timestamp": 1000000,
        "type": "message",
        "source": {"type": "user", "userId": user},
        "message": {"type": "text", "id": message_id, "text": text},
        "replyToken": "SYNTHETIC-REPLY-TOKEN",
        "deliveryContext": {"isRedelivery": False},
    }


class DurableReceiver:
    """Test oracle only: NOT V2 or a real authenticated transport."""

    def __init__(self, path, timeout_after_commit=False):
        self.path, self.timeout_after_commit = str(path), timeout_after_commit
        with contextlib.closing(sqlite3.connect(self.path)) as db, db:
            db.execute(
                "CREATE TABLE IF NOT EXISTS canonical (source TEXT PRIMARY KEY, body TEXT)"
            )

    async def accept_durably(self, envelope):
        key = (
            envelope["channel_reference"]
            + ":"
            + envelope["event_type"]
            + ":"
            + (
                envelope["provider_message_reference"]
                or envelope["provider_event_reference"]
            )
        )
        with contextlib.closing(sqlite3.connect(self.path)) as db, db:
            db.execute(
                "INSERT OR IGNORE INTO canonical VALUES (?,?)", (key, envelope["text"])
            )
        if self.timeout_after_commit:
            raise TimeoutError("SYNTHETIC-PRIVATE-EXCEPTION")
        return envelope["relay_id"]


class SecurityRelayTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "local-test.sqlite3"
        self.receiver_path = Path(self.temp.name) / "receiver-test.sqlite3"
        self.store = LocalReceiptStore(self.path)
        self.now = 1000.0
        self.settings = SETTINGS
        self.router = LocalPilotRouter(self.store, lambda: self.now)
        main.app.state.webhook_settings_provider = lambda: self.settings
        main.app.state.local_pilot_router = self.router
        self.addCleanup(lambda: delattr(main.app.state, "webhook_settings_provider"))
        self.addCleanup(
            lambda: (
                delattr(main.app.state, "local_pilot_router")
                if hasattr(main.app.state, "local_pilot_router")
                else None
            )
        )
        self.client = TestClient(main.app)
        self.addCleanup(self.client.close)
        # Hard fail on accidental real service calls throughout the suite.
        original_connect = socket.socket.connect

        def guarded_connect(sock, address):
            # Windows asyncio creates a loopback socketpair for its wakeup pipe.
            if isinstance(address, tuple) and address[0] in {"127.0.0.1", "::1"}:
                return original_connect(sock, address)
            raise AssertionError("external_network_forbidden")

        self.network = patch.object(socket.socket, "connect", guarded_connect)
        self.network.start()
        self.addCleanup(self.network.stop)
        self.lookup = patch.object(
            main, "read_sheet_records", side_effect=AssertionError("sheets_forbidden")
        )
        self.lookup.start()
        self.addCleanup(self.lookup.stop)
        self.legacy = AsyncMock()
        self.dispatch = patch.object(main, "dispatch_legacy_event", self.legacy)
        self.dispatch.start()
        self.addCleanup(self.dispatch.stop)

    def post(self, events, *, signature="valid", raw=None):
        raw = (
            raw
            if raw is not None
            else json.dumps(
                {"destination": "synthetic-destination", "events": events}
            ).encode()
        )
        headers = {"content-type": "application/json"}
        if signature == "valid":
            headers["x-line-signature"] = base64.b64encode(
                hmac.digest(SECRET, raw, "sha256")
            ).decode()
        elif signature is not None:
            headers["x-line-signature"] = signature
        return self.client.post("/webhook", content=raw, headers=headers)

    def worker(self, receiver=None):
        return LocalRelayWorker(
            self.store,
            receiver or DurableReceiver(self.receiver_path),
            lambda: self.settings.pilot_enabled and bool(self.settings.pilot_allowlist),
            lambda: self.now,
            timeout=0.05,
        )

    def test_T1_valid_signature_accepted(self):
        self.assertEqual(self.post([event()]).status_code, 200)
        self.assertEqual(len(self.store.inventory()), 1)

    def test_T2_invalid_signature_no_parse_or_side_effect(self):
        with patch("main.parse_verified_body") as parser:
            self.assertEqual(
                self.post([], signature="x" * 44, raw=b"not json").status_code, 401
            )
            parser.assert_not_called()
        self.legacy.assert_not_awaited()
        self.assertEqual(self.store.inventory(), [])

    def test_T3_missing_signature(self):
        self.assertEqual(self.post([event()], signature=None).status_code, 401)
        self.legacy.assert_not_awaited()
        self.assertEqual(self.store.inventory(), [])

    def test_T4_nonpilot_dispatch_equivalent(self):
        original = event(user=OTHER)
        self.assertEqual(self.post([original]).status_code, 200)
        self.legacy.assert_awaited_once_with(original)
        self.assertEqual(self.store.inventory()[0]["state"], "done")

    def test_T5_pilot_suppresses_legacy(self):
        self.assertEqual(self.post([event()]).status_code, 200)
        self.legacy.assert_not_awaited()

    def test_T6_one_normalized_relay_no_credentials_or_raw_identity(self):
        self.post([event()])
        job = self.store.claim(self.now)
        envelope = json.loads(job["payload"])
        self.assertEqual(envelope["text"], TEXT)
        self.assertEqual(envelope["schema"], "line-relay.v1")
        self.assertEqual(len(envelope["external_identity_reference"]), 64)
        for forbidden in (
            PILOT,
            "SYNTHETIC-REPLY-TOKEN",
            SECRET.decode(),
            "replyToken",
            "access_token",
        ):
            self.assertNotIn(forbidden, job["payload"])
        self.assertIsNone(self.store.claim(self.now))

    def test_T7_duplicate_event_and_message(self):
        self.post([event()])
        again = event()
        again["deliveryContext"]["isRedelivery"] = True
        again["replyToken"] = "SYNTHETIC-NEW-REPLY-TOKEN"
        self.assertEqual(self.post([again]).status_code, 200)
        self.assertEqual(self.post([event(event_id="event-new")]).status_code, 200)
        self.assertEqual(len(self.store.inventory()), 1)

    def test_T8_mixed_batch_and_redelivery(self):
        batch = [
            event(user=OTHER),
            event("event-2", "message-2"),
            event("event-3", "message-3", OTHER),
        ]
        self.assertEqual(self.post(batch).status_code, 200)
        self.assertEqual(self.post(batch).status_code, 200)
        self.assertEqual(self.legacy.await_count, 2)
        self.assertEqual(sum(x["route"] == "pilot" for x in self.store.inventory()), 1)

    def test_T9_timeout_does_not_change_webhook_ack_or_duplicate_v1(self):
        receiver = DurableReceiver(self.receiver_path, timeout_after_commit=True)
        batch = [event(), event("event-2", "message-2", OTHER)]
        self.assertEqual(self.post(batch).status_code, 200)
        self.assertEqual(
            asyncio.run(self.worker(receiver).once()), "pending_or_blocked"
        )
        self.assertEqual(self.post(batch).status_code, 200)
        self.legacy.assert_awaited_once()
        self.now += 5
        self.assertEqual(asyncio.run(self.worker().once()), "accepted")
        with contextlib.closing(sqlite3.connect(self.receiver_path)) as db, db:
            self.assertEqual(
                db.execute("SELECT count(*) FROM canonical").fetchone()[0], 1
            )

    def test_T10_process_restart_preserves_handoff_and_receiver_dedupe(self):
        self.post([event()])
        script = """
import asyncio,sys
sys.path.insert(0,'tests')
from test_security_relay import DurableReceiver
from local_relay_store import LocalReceiptStore
from pilot_relay import LocalRelayWorker
worker=LocalRelayWorker(LocalReceiptStore(sys.argv[1]),DurableReceiver(sys.argv[2],sys.argv[3]=='timeout'),lambda:True,lambda:float(sys.argv[4]))
asyncio.run(worker.once())
"""
        for mode, now in (("timeout", "1000"), ("success", "1005")):
            result = subprocess.run(
                [
                    sys.executable,
                    "-c",
                    script,
                    str(self.path),
                    str(self.receiver_path),
                    mode,
                    now,
                ],
                capture_output=True,
                text=True,
                timeout=20,
            )
            self.assertEqual(result.returncode, 0, "subprocess restart proof failed")
        reopened = LocalReceiptStore(self.path)
        self.assertEqual(reopened.inventory()[0]["state"], "done")
        with contextlib.closing(sqlite3.connect(self.receiver_path)) as db, db:
            self.assertEqual(
                db.execute("SELECT count(*) FROM canonical").fetchone()[0], 1
            )

    def test_T11_off_and_empty_allowlist_no_relay_dependency(self):
        for settings in (
            dataclasses.replace(SETTINGS, pilot_enabled=False),
            dataclasses.replace(SETTINGS, pilot_allowlist=frozenset()),
        ):
            self.settings = settings
            with patch.object(
                self.router, "process", side_effect=AssertionError("relay_forbidden")
            ):
                self.assertEqual(self.post([event()]).status_code, 200)
            self.assertEqual(asyncio.run(self.worker().once()), "disabled")
        self.assertEqual(self.legacy.await_count, 2)
        self.assertEqual(self.store.inventory(), [])

    def test_T12_logs_exclude_private_values_even_on_failure(self):
        private = TEXT + PILOT + SECRET.decode() + "SYNTHETIC-REPLY-TOKEN"
        self.legacy.side_effect = RuntimeError(private)
        output = io.StringIO()
        with (
            contextlib.redirect_stdout(output),
            self.assertLogs("line_ingress", level="INFO") as logs,
        ):
            self.assertEqual(self.post([event(user=OTHER)]).status_code, 503)
        combined = output.getvalue() + " ".join(logs.output)
        for forbidden in (TEXT, PILOT, OTHER, SECRET.decode(), "SYNTHETIC-REPLY-TOKEN"):
            self.assertNotIn(forbidden, combined)

    def test_signature_unicode_and_changed_body(self):
        with self.assertRaises(IngressError) as failure:
            verify_signature(b"{}", "異" * 44, SECRET)
        self.assertEqual(failure.exception.status, 401)
        signature = base64.b64encode(hmac.digest(SECRET, b"{}", "sha256")).decode()
        self.assertEqual(self.post([event()], signature=signature).status_code, 401)

    def test_missing_secret_fails_closed(self):
        self.settings = dataclasses.replace(SETTINGS, channel_secret=b"")
        self.assertEqual(self.post([event()]).status_code, 503)
        self.legacy.assert_not_awaited()

    def test_malformed_batch_is_atomic_before_side_effects(self):
        for bad in (
            None,
            {"type": "message", "source": []},
            {"type": "message", "message": {"type": "text", "text": 7}},
        ):
            self.assertEqual(self.post([event(user=OTHER), bad]).status_code, 400)
        self.assertEqual(self.store.inventory(), [])
        self.legacy.assert_not_awaited()

    def test_body_bound_destination_and_empty_verify_batch(self):
        self.assertEqual(
            self.post([], raw=b"x" * (MAX_BODY_BYTES + 1)).status_code, 413
        )
        self.assertEqual(
            self.post([], raw=b'{"destination":"wrong","events":[]}').status_code, 403
        )
        self.assertEqual(self.post([]).status_code, 200)

    def test_event_and_message_conflicts_roll_back_batch(self):
        self.post([event()])
        for changed in (event(text="changed"), event("event-2", text="changed")):
            response = self.post([event("new", "new", OTHER), changed])
            self.assertEqual(response.status_code, 409)
        self.assertEqual(len(self.store.inventory()), 1)
        self.legacy.assert_not_awaited()

    def test_storage_failure_no_v1_effects_no_false_ack(self):
        with patch.object(self.store, "prepare_batch", side_effect=OSError(TEXT)):
            self.assertEqual(
                self.post([event(), event("event-2", "message-2", OTHER)]).status_code,
                503,
            )
        self.legacy.assert_not_awaited()

    def test_unknown_v1_outcome_not_blindly_retried(self):
        self.legacy.side_effect = RuntimeError("crash_after_effect")
        batch = [event(user=OTHER), event("event-2", "message-2")]
        self.assertEqual(self.post(batch).status_code, 503)
        self.assertEqual(self.post(batch).status_code, 503)
        self.legacy.assert_awaited_once()
        self.assertIn("unknown", [x["state"] for x in self.store.inventory()])
        # Different nonpilot work can still complete while prior work needs review.
        self.legacy.side_effect = None
        self.assertEqual(self.post([event("new", "new", OTHER)]).status_code, 200)

    def test_lease_recovery_and_fencing(self):
        self.post([event()])
        old = self.store.claim(self.now)
        self.assertIsNone(LocalReceiptStore(self.path).claim(self.now + 1))
        new = LocalReceiptStore(self.path).claim(self.now + 31)
        self.assertFalse(self.store.complete(old, True, self.now + 32))
        self.assertTrue(self.store.complete(new, True, self.now + 32))

    def test_worker_bound_timeout_and_exhaustion_keeps_receipt(self):
        class Slow:
            async def accept_durably(self, envelope):
                await asyncio.sleep(1)

        self.post([event()])
        for _ in range(5):
            self.assertEqual(
                asyncio.run(self.worker(Slow()).once()), "pending_or_blocked"
            )
            self.now += 61
        self.assertEqual(self.store.inventory()[0]["state"], "blocked")
        self.assertEqual(asyncio.run(self.worker().once()), "idle")

    def test_worker_off_preserves_pending(self):
        self.post([event()])
        self.settings = dataclasses.replace(SETTINGS, pilot_enabled=False)
        self.assertEqual(asyncio.run(self.worker().once()), "disabled")
        self.assertEqual(self.store.inventory()[0]["state"], "pending")

    def test_pilot_on_without_local_binding_fails_closed(self):
        del main.app.state.local_pilot_router
        response = self.post([event()])
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"], "durable_relay_not_configured")
        self.legacy.assert_not_awaited()

    def test_group_not_claimed_by_user_allowlist(self):
        grouped = event()
        grouped["source"]["type"] = "group"
        grouped["source"]["groupId"] = "SYNTHETIC-GROUP"
        self.assertEqual(self.post([grouped]).status_code, 200)
        self.legacy.assert_awaited_once()

    def test_pilot_control_events_and_unsupported_no_reply(self):
        control = event()
        control.update(type="unfollow")
        control.pop("replyToken")
        control.pop("message")
        image = event("image", "image")
        image["message"] = {"type": "image", "id": "image"}
        self.assertEqual(self.post([control, image]).status_code, 200)
        self.legacy.assert_not_awaited()
        self.assertEqual(
            sorted(x["route"] for x in self.store.inventory()), ["ignored", "pilot"]
        )

    def test_runtime_flag_default_and_empty_allowlist(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertFalse(runtime_settings().pilot_enabled)
        with patch.dict(os.environ, {"LINE_V2_PILOT_ENABLED": "true"}, clear=True):
            self.assertEqual(runtime_settings().pilot_allowlist, frozenset())

    def test_command_regression_aliases_and_default(self):
        cases = {
            "說明": "help",
            "白沙屯": "shrine",
            "查友宮 白沙屯": "shrine",
            "查廟 白沙屯": "shrine",
            "查來訪 測試宮": "visit",
            "請帖 測試宮": "visit",
            "測試宮來訪": "visit",
            "公告": "announcement",
            "活動公告": "announcement",
            "查紀錄": "log_recent",
            "查記錄": "log_recent",
            "最近查詢": "log_recent",
            "查無資料": "log_not_found",
            "補資料": "log_not_found",
            "待補清單": "backfill_suggestions",
            "補資料建議": "backfill_suggestions",
            "": "unknown",
            "查來訪": "unknown",
        }
        for text, kind in cases.items():
            with self.subTest(text=text):
                self.assertEqual(parse_command(text).command_type, kind)
        self.assertEqual(parse_command("anything", "image").command_type, "unknown")

    def test_real_v1_function_chain_queries_replies_then_logs(self):
        self.dispatch.stop()  # Exercise real handler, not mock-only routing.
        self.settings = dataclasses.replace(SETTINGS, pilot_enabled=False)
        trace = []

        async def reply(token, text):
            trace.append("reply")
            self.assertTrue(text)

        def audit(**kwargs):
            trace.append("audit")
            self.assertEqual(kwargs["line_user_id"], OTHER)

        for text, query_type in (
            ("說明", "help"),
            ("不存在的測試宮", "shrine"),
            ("公告", "announcement"),
            ("查來訪 測試宮", "visit"),
            ("查紀錄", "log_recent"),
            ("補資料建議", "backfill_suggestions"),
        ):
            trace.clear()
            with (
                patch.object(main, "read_sheet_records", return_value=[]) as read,
                patch.object(main, "reply_text_message", side_effect=reply),
                patch.object(main, "append_line_query_log", side_effect=audit) as log,
            ):
                self.assertEqual(
                    self.post([event(user=OTHER, text=text)]).status_code, 200
                )
                self.assertEqual(trace, ["reply", "audit"])
                self.assertEqual(log.call_args.kwargs["query_type"], query_type)
                if query_type != "help":
                    self.assertTrue(read.called)

    def test_v1_exception_body_not_in_logs_or_sheet_error_field(self):
        self.dispatch.stop()
        self.settings = dataclasses.replace(SETTINGS, pilot_enabled=False)
        with (
            patch.object(
                main,
                "read_sheet_records",
                side_effect=RuntimeError(TEXT + SECRET.decode()),
            ),
            patch.object(main, "reply_text_message", new=AsyncMock()),
            patch.object(main, "append_line_query_log") as audit,
            self.assertLogs("line_ingress") as logs,
        ):
            self.assertEqual(self.post([event(user=OTHER)]).status_code, 200)
        self.assertEqual(
            audit.call_args.kwargs["error_message"], "legacy_lookup_failed"
        )
        self.assertNotIn(TEXT, str(logs.output))
        self.assertNotIn(SECRET.decode(), str(logs.output))

    def test_legacy_crash_before_completion_requires_review_after_reopen(self):
        from pilot_relay import normalize

        item = normalize(event(user=OTHER), SETTINGS, self.now)
        receipt = self.store.prepare_batch([item], self.now)[0]
        self.assertEqual(self.store.begin_legacy(receipt["receipt"]), "pending")
        # Simulate process loss after external effect, before marking done.
        main.app.state.local_pilot_router = LocalPilotRouter(
            LocalReceiptStore(self.path), lambda: self.now
        )
        self.assertEqual(self.post([event(user=OTHER)]).status_code, 503)
        self.legacy.assert_not_awaited()

    def test_concurrent_duplicate_admission_is_single_receipt(self):
        from concurrent.futures import ThreadPoolExecutor
        from pilot_relay import normalize

        item = normalize(event(), SETTINGS, self.now)
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(
                pool.map(
                    lambda _: LocalReceiptStore(self.path).prepare_batch(
                        [item], self.now
                    ),
                    range(2),
                )
            )
        self.assertEqual(results[0][0]["receipt"], results[1][0]["receipt"])
        self.assertEqual(len(self.store.inventory()), 1)

    def test_wrong_relay_ack_cannot_complete(self):
        class WrongReceipt:
            async def accept_durably(self, envelope):
                return "not-the-receipt"

        self.post([event()])
        self.assertEqual(
            asyncio.run(self.worker(WrongReceipt()).once()), "pending_or_blocked"
        )
        self.assertEqual(self.store.inventory()[0]["state"], "pending")

    def test_nonpilot_duplicate_message_new_event_does_not_repeat_audit(self):
        self.post([event(user=OTHER)])
        self.assertEqual(self.post([event("new-event", user=OTHER)]).status_code, 200)
        self.legacy.assert_awaited_once()

    def test_line_transport_http_failure_does_not_expose_provider_response(self):
        import httpx
        import line_client

        body = TEXT + SECRET.decode()
        response = httpx.Response(
            400,
            text=body,
            request=httpx.Request("POST", "https://synthetic.invalid/reply"),
        )
        fake = AsyncMock()
        fake.__aenter__.return_value = fake
        fake.post.return_value = response
        output = io.StringIO()
        with (
            patch.dict(
                os.environ,
                {"LINE_CHANNEL_ACCESS_TOKEN": "SYNTHETIC-ACCESS-TOKEN"},
                clear=True,
            ),
            patch.object(line_client.httpx, "AsyncClient", return_value=fake),
            contextlib.redirect_stdout(output),
            self.assertRaises(RuntimeError) as failure,
        ):
            asyncio.run(line_client.reply_text_message("SYNTHETIC-REPLY-TOKEN", TEXT))
        self.assertEqual(str(failure.exception), "line_reply_failed")
        self.assertEqual(output.getvalue(), "")

    def test_new_modules_and_app_imports_have_no_config_or_storage_io(self):
        script = """
import fastapi,httpx,gspread,sqlite3,os
from unittest.mock import patch
def environment(name, default=None):
    if name.startswith(('LINE_', 'GOOGLE_', 'SHEETS_', 'DEBUG_', 'ENABLE_DEBUG')):
        raise AssertionError('application_environment_read_on_import')
    return default  # Framework plugin discovery only; never reads real values.
with patch('os.getenv',side_effect=environment), patch('sqlite3.connect',side_effect=AssertionError('storage_on_import')):
    import main,webhook_security,pilot_relay,local_relay_store
"""
        result = subprocess.run(
            [sys.executable, "-c", script], capture_output=True, text=True, timeout=20
        )
        self.assertEqual(result.returncode, 0, "import purity check failed")

    def test_invalid_pilot_config_and_identity_shape_rejected(self):
        with patch.dict(os.environ, {"LINE_V2_PILOT_ENABLED": "maybe"}, clear=True):
            with self.assertRaises(IngressError):
                runtime_settings()
        self.settings = dataclasses.replace(SETTINGS, identity_key=b"")
        self.assertEqual(self.post([event()]).status_code, 503)
        self.settings = SETTINGS
        invalid = event()
        invalid["source"]["userId"] = []
        self.assertEqual(self.post([invalid]).status_code, 400)

    def test_successful_existing_business_builders_match_original_source(self):
        # Immutable reviewed source is a regression oracle; functions run only
        # with synthetic records, no process or request to production services.
        import types
        from unittest.mock import Mock

        baseline = subprocess.run(
            ["git", "show", "9c294f90a207c736b31b83af57102f35fb8f0e95:main.py"],
            capture_output=True,
            check=True,
        ).stdout.decode("utf-8")
        old = types.ModuleType("reviewed_legacy_main")
        exec(compile(baseline, "reviewed_legacy_main", "exec"), old.__dict__)
        fixture = {
            "members": [
                {
                    "line_uid": OTHER,
                    "active": "yes",
                    "can_view_internal_shrine": "yes",
                    "name": "Synthetic operator",
                }
            ],
            "shrines": [
                {
                    "name": "Synthetic Temple",
                    "shrine_id": "synthetic-shrine",
                    "is_public": "yes",
                }
            ],
            "shrine_visits": [],
            "announcements": [],
            "line_query_logs": [],
        }
        old.read_sheet_records = Mock(side_effect=lambda sheet: fixture[sheet])
        with (
            patch.object(
                main, "read_sheet_records", side_effect=lambda sheet: fixture[sheet]
            ),
            contextlib.redirect_stdout(io.StringIO()),
        ):
            for text in (
                "Synthetic Temple",
                "說明",
                "查紀錄",
                "查無資料",
                "補資料建議",
                "查來訪 Synthetic Temple",
                "公告",
            ):
                command = parse_command(text)
                self.assertEqual(
                    main.build_command_reply(command, OTHER),
                    old.build_command_reply(command, OTHER),
                )


class HardenedOffTests(unittest.TestCase):
    def test_runtime_refuses_pilot_allowlist_and_outbound(self):
        from webhook_security import hardened_off_settings

        for values in (
            {"LINE_V2_PILOT_ENABLED": "true"},
            {"LINE_V2_PILOT_ALLOWLIST": "SYNTHETIC-ONLY"},
            {"LINE_OUTBOUND_ENABLED": "true"},
        ):
            with patch.dict(os.environ, values, clear=True):
                with self.assertRaises(IngressError):
                    hardened_off_settings()

    def test_readiness_missing_and_present_secret(self):
        client = TestClient(main.app)
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(client.get("/ready").status_code, 503)
        with patch.dict(
            os.environ, {"LINE_CHANNEL_SECRET": SECRET.decode()}, clear=True
        ):
            result = client.get("/ready")
            self.assertEqual(result.status_code, 200)
            self.assertTrue(result.json()["allowlist_empty"])
            self.assertNotIn(SECRET.decode(), result.text)

    def test_off_reply_then_audit_failure_does_not_request_duplicate_batch(self):
        with (
            patch.object(main, "build_command_reply", return_value=("synthetic", {})),
            patch.object(main, "reply_text_message", new_callable=AsyncMock) as reply,
            patch.object(
                main, "append_line_query_log", side_effect=RuntimeError("synthetic")
            ),
        ):
            asyncio.run(
                main.handle_text_message(
                    reply_token="SYNTHETIC",
                    user_id="SYNTHETIC",
                    message_text="synthetic",
                    effects=None,
                )
            )
            reply.assert_awaited_once()


if __name__ == "__main__":
    unittest.main()
