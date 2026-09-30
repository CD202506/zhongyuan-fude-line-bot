"""Synthetic-only persisted ownership and OFF-isolation regression."""

import asyncio
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import Mock

from relay_journal import JournalError, RelayJournal
from relay_runtime import RelayRuntime, synthetic_event
from receipt_contract.contract import ContractError

ORG = "00000000-0000-0000-0000-000000000001"
RID = "00000000-0000-0000-0000-000000000002"


class RelayTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "journal.sqlite3"
        self.now = 100.0
        self.journal = RelayJournal(self.path, lambda: self.now)
        self.event = synthetic_event(ORG, "synthetic-test-one")

    def test_restart_ownership_alias_and_conflict(self):
        key = self.journal.receive(self.event)
        again = RelayJournal(self.path, lambda: self.now)
        self.assertEqual(key, again.receive(self.event))
        self.assertEqual(
            key,
            again.receive(
                replace(
                    self.event, event_reference="synthetic-alias", event_timestamp=2000
                )
            ),
        )
        with self.assertRaises(JournalError):
            again.receive(replace(self.event, text="SYNTHETIC: changed"))
        with self.assertRaises(JournalError):
            again.receive(replace(self.event, message_reference="synthetic-other"))
        self.assertNotIn(
            self.event.text, self.path.read_bytes().decode(errors="ignore")
        )
        self.assertNotIn(
            self.event.identity_reference,
            self.path.read_bytes().decode(errors="ignore"),
        )

    def test_concurrent_claim_once(self):
        key = self.journal.receive(self.event)
        with ThreadPoolExecutor(max_workers=6) as executor:
            leases = list(executor.map(lambda _: self.journal.claim(key), range(12)))
        self.assertEqual(sum(x is not None for x in leases), 1)
        self.assertEqual(self.journal.inspect(key)["attempts"], 1)

    def test_reclaim_unknown_no_retry(self):
        key = self.journal.receive(self.event)
        lease = self.journal.claim(key)
        with self.assertRaises(JournalError):
            self.journal.operate(key, "reclaim", "a" * 64, "b" * 64)
        self.now = 111
        self.journal.operate(key, "reclaim", "a" * 64, "b" * 64)
        with self.assertRaises(JournalError):
            self.journal.finish(key, lease, "durable_accepted", RID)
        with self.assertRaises(JournalError):
            self.journal.operate(key, "retry", "a" * 64, "b" * 64)
        self.journal.operate(key, "resolve", "a" * 64, "b" * 64)
        self.assertIsNone(self.journal.claim(key))
        self.assertEqual(self.journal.inspect(key)["state"], "resolved")

    def test_failure_classes_and_reopen(self):
        for code, state in [
            ("relay_auth_rejected", "terminal_failure"),
            ("relay_connect_unavailable", "retryable_failure"),
            ("relay_transport_unknown", "unknown_outcome"),
        ]:
            event = replace(
                self.event,
                event_reference="synthetic-" + code,
                message_reference="synthetic-" + code,
            )

            class Transport:
                async def accept(self, event):
                    raise ContractError(code, 503)

            result = asyncio.run(RelayRuntime(self.journal).handoff(event, Transport()))
            self.assertEqual(result["state"], state)
            self.assertEqual(
                RelayJournal(self.path).inspect(result["key"])["state"], state
            )

    def test_success_dedupe(self):
        count = []

        class Transport:
            async def accept(self, event):
                count.append(1)
                return RID

        runtime = RelayRuntime(self.journal)
        first = asyncio.run(runtime.handoff(self.event, Transport()))
        second = asyncio.run(runtime.handoff(self.event, Transport()))
        self.assertEqual(first["receipt_id"], second["receipt_id"])
        self.assertEqual(len(count), 1)
        self.assertEqual(first["state"], "durable_accepted")

    def test_off_v1_does_not_touch_failed_journal(self):
        journal = Mock()
        journal.receive.side_effect = AssertionError("journal_dependency")
        settings = Mock(pilot_enabled=False, pilot_allowlist=frozenset())
        calls = []

        async def legacy(event):
            calls.append(event)

        asyncio.run(
            RelayRuntime(journal).dispatch_real([{"type": "message"}], settings, legacy)
        )
        self.assertEqual(len(calls), 1)
        journal.receive.assert_not_called()

    def test_metrics_requires_path_bound_auth(self):
        import time
        from unittest.mock import patch
        from fastapi.testclient import TestClient
        from main import app
        from receipt_contract.contract import sign

        app.state.production_relay = RelayRuntime(self.journal)
        self.addCleanup(lambda: delattr(app.state, "production_relay"))
        key = b"synthetic-only-metrics-key-at-least-32-bytes"
        stamp, nonce = str(int(time.time())), "synthetic-nonce-123456"
        headers = {"x-key-id": "synthetic", "x-timestamp": stamp, "x-nonce": nonce}
        with patch.dict(
            "os.environ",
            {
                "RECEIPT_ADMISSION_KEY_ID": "synthetic",
                "RECEIPT_ADMISSION_HMAC": key.decode(),
            },
        ):
            client = TestClient(app)
            self.assertEqual(
                client.post("/internal/relay/metrics", content=b"{}").status_code, 401
            )
            headers["x-signature"] = sign(key, "synthetic", stamp, nonce, b"{}")
            self.assertEqual(
                client.post(
                    "/internal/relay/metrics", content=b"{}", headers=headers
                ).status_code,
                401,
            )
            headers["x-signature"] = sign(
                key, "synthetic", stamp, nonce, b"{}", "/internal/relay/metrics"
            )
            result = client.post(
                "/internal/relay/metrics", content=b"{}", headers=headers
            )
            self.assertEqual(result.status_code, 200)
            self.assertEqual(result.json()["states"], {})

    def test_real_relay_denied(self):
        with self.assertRaises(JournalError):
            asyncio.run(
                RelayRuntime(self.journal).handoff(
                    replace(self.event, provider="line"), Mock()
                )
            )

    def test_retry_budget_and_metrics(self):
        key = self.journal.receive(self.event)
        for _ in range(5):
            lease = self.journal.claim(key)
            self.journal.finish(key, lease, "retryable_failure", reason="unavailable")
        self.assertIsNone(self.journal.claim(key))
        self.assertEqual(self.journal.metrics()["states"], {"terminal_failure": 1})


if __name__ == "__main__":
    unittest.main()
