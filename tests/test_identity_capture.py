"""Fictional signed webhook tests; all business effects are asserted absent."""

import base64
import copy
import hmac
import json
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from dataclasses import replace
from pathlib import Path
from unittest.mock import AsyncMock, Mock, patch

from fastapi.testclient import TestClient
import main
from identity_capture import Capture, durable_write
from webhook_security import WebhookSettings, IngressError, private_reference


class CaptureTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.now = 1000
        self.key = b"synthetic-only-key-material-0000000"
        self.text = "身份確認 SYNTHETIC-ONE-TIME-CODE"
        self.cfg = dict(
            session="a" * 32,
            enabled=True,
            starts=999,
            expires=1100,
            channel="synthetic-scope",
            destination="synthetic-destination",
            identity_key=self.key.hex(),
            code_digest=hmac.digest(
                self.key, ("code\0" + self.text).encode(), "sha256"
            ).hex(),
            consent_reference="synthetic-consent",
            key_version="synthetic-v1",
            candidate_secret="synthetic",
        )
        durable_write(self.root / "session.json", self.cfg)
        self.event = dict(
            type="message",
            webhookEventId="synthetic-event",
            timestamp=1000000,
            source={"type": "user", "userId": "SYNTHETIC-PRIVATE-SUBJECT"},
            message={"type": "text", "id": "synthetic-message", "text": self.text},
            replyToken="SYNTHETIC-REPLY",
        )
        self.settings = WebhookSettings(
            b"synthetic-signature-material",
            False,
            frozenset(),
            "synthetic-scope",
            "synthetic-destination",
            self.key,
        )
        self.sink = Mock()
        self.capture = Capture(self.root, self.sink, lambda: self.now)
        self.legacy = AsyncMock()
        main.app.state.webhook_settings_provider = lambda: self.settings
        main.app.state.identity_capture = self.capture
        self.addCleanup(lambda: delattr(main.app.state, "webhook_settings_provider"))
        self.addCleanup(lambda: delattr(main.app.state, "identity_capture"))
        self.client = TestClient(main.app)

    def post(self, events=None, signature=True, destination="synthetic-destination"):
        body = json.dumps(
            {"destination": destination, "events": events or [self.event]}
        ).encode()
        sig = base64.b64encode(
            hmac.digest(self.settings.channel_secret, body, "sha256")
        ).decode()
        with (
            patch.object(main, "dispatch_legacy_event", self.legacy),
            patch.object(main, "reply_text_message", AsyncMock()) as reply,
            patch.object(main, "append_line_query_log", Mock()) as logs,
        ):
            r = self.client.post(
                "/webhook",
                content=body,
                headers={"x-line-signature": sig} if signature else {},
            )
            reply.assert_not_called()
            logs.assert_not_called()
        return r

    def test_signed_capture_no_business_effects(self):
        self.assertEqual(self.post().status_code, 200)
        self.legacy.assert_not_called()
        payload = self.sink.put.call_args.args[1]
        self.assertEqual(
            payload["identity_reference"],
            private_reference(
                self.key, "identity:synthetic-scope", self.event["source"]["userId"]
            ),
        )
        self.assertFalse(payload["pilot_eligible"])
        self.assertNotIn("text", payload)
        self.assertNotIn("replyToken", payload)
        self.assertFalse(
            json.loads((self.root / "session.json").read_text())["enabled"]
        )

    def test_signature_required(self):
        self.assertEqual(self.post(signature=False).status_code, 401)
        self.sink.put.assert_not_called()
        self.legacy.assert_not_called()

    def test_wrong_destination(self):
        self.assertEqual(self.post(destination="wrong").status_code, 403)
        self.sink.put.assert_not_called()

    def test_missing_config_disabled(self):
        (self.root / "session.json").unlink()
        self.assertEqual(self.post().status_code, 200)
        self.sink.put.assert_not_called()
        self.legacy.assert_not_called()

    def test_disabled_swallows_code(self):
        self.cfg["enabled"] = False
        durable_write(self.root / "session.json", self.cfg)
        self.assertEqual(self.post().status_code, 200)
        self.sink.put.assert_not_called()
        self.legacy.assert_not_called()

    def test_expired(self):
        self.now = 1101
        self.post()
        self.sink.put.assert_not_called()
        self.legacy.assert_not_called()

    def test_stale_event(self):
        self.event["timestamp"] = 998000
        self.post()
        self.sink.put.assert_not_called()

    def test_group_rejected_without_side_effect(self):
        self.event["source"]["type"] = "group"
        self.post()
        self.sink.put.assert_not_called()
        self.legacy.assert_not_called()

    def test_wrong_code_no_legacy(self):
        self.event["message"]["text"] = "身份確認 SYNTHETIC-WRONG"
        self.post()
        self.sink.put.assert_not_called()
        self.legacy.assert_not_called()

    def test_mixed_batch_preserves_only_unrelated(self):
        other = copy.deepcopy(self.event)
        other["message"]["text"] = "help"
        self.post([self.event, other])
        self.legacy.assert_awaited_once_with(other)

    def test_store_failure_no_fallback_or_batch_retry(self):
        self.sink.put.side_effect = TimeoutError("SYNTHETIC-SENSITIVE-ERROR")
        other = copy.deepcopy(self.event)
        other["message"]["text"] = "help"
        with self.assertLogs("line_ingress", level="ERROR") as logs:
            r = self.post([self.event, other])
        self.assertEqual(r.status_code, 200)
        self.legacy.assert_awaited_once_with(other)
        self.assertNotIn("SENSITIVE", str(logs.output))
        with self.assertLogs("line_ingress", level="ERROR"):
            self.post()
        self.assertEqual(self.sink.put.call_count, 1)

    def test_dedupe_after_restart(self):
        self.post()
        main.app.state.identity_capture = Capture(self.root, self.sink, lambda: 1200)
        self.post()
        self.assertEqual(self.sink.put.call_count, 1)

    def test_second_subject_cannot_consume(self):
        self.post()
        self.event["source"]["userId"] = "SYNTHETIC-SECOND"
        self.post()
        self.assertEqual(self.sink.put.call_count, 1)
        self.legacy.assert_not_called()

    def test_concurrent_single_winner(self):
        def run(_):
            try:
                self.capture.process(self.event, "synthetic-destination", self.settings)
            except (IngressError, ValueError):
                pass

        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(run, range(16)))
        self.assertEqual(self.sink.put.call_count, 1)

    def test_no_raw_subject_body_in_local_markers(self):
        self.post()
        for path in self.root.iterdir():
            value = path.read_text()
            self.assertNotIn(self.event["source"]["userId"], value)
            self.assertNotIn(self.text, value)
            self.assertNotIn("SYNTHETIC-REPLY", value)

    def test_pilot_on_rejected(self):
        self.settings = replace(self.settings, pilot_enabled=True)
        with self.assertLogs("line_ingress", level="ERROR"):
            self.post()
        self.sink.put.assert_not_called()
        self.legacy.assert_not_called()

    def test_unrelated_does_not_read_capture_config(self):
        (self.root / "session.json").write_text("BROKEN")
        self.event["message"]["text"] = "help"
        self.post()
        self.legacy.assert_awaited_once()
        self.sink.put.assert_not_called()

    def test_missing_event_id(self):
        del self.event["webhookEventId"]
        with self.assertLogs("line_ingress", level="ERROR"):
            self.post()
        self.sink.put.assert_not_called()
        self.legacy.assert_not_called()


class OperatorTests(unittest.TestCase):
    def setUp(self):
        import identity_capture_operator as op

        self.op = op
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.key = b"synthetic-operator-key-000000000000"
        self.cfg = dict(
            session="b" * 32,
            prepared=1000,
            starts=0,
            expires=0,
            enabled=False,
            identity_key=self.key.hex(),
            code_digest=hmac.digest(self.key, b"code\0synthetic", "sha256").hex(),
        )
        durable_write(self.root / "session.json", self.cfg)
        for target, value in [
            ("ROOT", self.root),
            ("guard", Mock()),
            ("SecretStore", Mock()),
        ]:
            patcher = patch.object(op, target, value)
            patcher.start()
            self.addCleanup(patcher.stop)
        self.op.SecretStore.return_value.get.return_value = {
            "session": "b" * 32,
            "verification_message": "synthetic",
        }

    def test_exact_ttl_and_no_rearm(self):
        with patch.object(self.op.time, "time", return_value=1001.25):
            self.op.arm()
            cfg = json.loads((self.root / "session.json").read_text())
            self.assertEqual(cfg["expires"] - cfg["starts"], 300)
            with self.assertRaises(RuntimeError):
                self.op.arm()

    def test_close_disables(self):
        with patch.object(self.op.time, "time", return_value=1001):
            self.op.arm()
        self.op.close()
        self.assertFalse(
            json.loads((self.root / "session.json").read_text())["enabled"]
        )

    def test_consumed_code_cannot_arm(self):
        durable_write(self.root / ("b" * 32 + ".claim"), {"fingerprint": "synthetic"})
        with self.assertRaises(RuntimeError):
            self.op.arm()

    def test_old_preparation_cannot_arm(self):
        with patch.object(self.op.time, "time", return_value=1901):
            with self.assertRaises(RuntimeError):
                self.op.arm()

    def test_control_mismatch(self):
        self.op.SecretStore.return_value.get.return_value["verification_message"] = (
            "wrong"
        )
        with patch.object(self.op.time, "time", return_value=1001):
            with self.assertRaises(RuntimeError):
                self.op.arm()

    def test_no_session_is_disabled(self):
        (self.root / "session.json").unlink()
        self.assertFalse(self.op.status()["capture_enabled"])


if __name__ == "__main__":
    unittest.main()
