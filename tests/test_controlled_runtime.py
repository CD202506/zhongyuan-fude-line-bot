import asyncio
import tempfile
import unittest
import uuid
from dataclasses import replace
from pathlib import Path
from unittest.mock import AsyncMock
from controlled_line_runtime import ControlledRuntime
from receipt_contract.journal import LegacyJournal
from webhook_security import WebhookSettings, IngressError

class ControlledRuntimeTests(unittest.TestCase):
    def test_mixed_batch_failure_and_off_ownership(self):
        with tempfile.TemporaryDirectory() as directory:
            journal = LegacyJournal(Path(directory)/"owners.sqlite3")
            transport, legacy = AsyncMock(), AsyncMock()
            settings = WebhookSettings(b"synthetic-signature", True, frozenset({"SYNTHETIC-A"}),
                "synthetic-channel", "synthetic-destination", b"synthetic-key-material-at-least-32-bytes")
            def event(key, user):
                return {"type":"message", "timestamp":1000, "webhookEventId":key,
                    "source":{"type":"user","userId":user}, "message":{"type":"text","id":key,"text":"SYNTHETIC: text"}, "replyToken":"SYNTHETIC"}
            pilot, other = event("synthetic-a","SYNTHETIC-A"), event("synthetic-b","SYNTHETIC-B")
            runtime = ControlledRuntime(journal, transport, str(uuid.uuid4()), AsyncMock(return_value=False))
            with self.assertRaises(IngressError):
                asyncio.run(runtime.dispatch_real([pilot,other], settings, legacy))
            self.assertEqual(legacy.await_count,1)
            transport.accept.assert_not_awaited()
            runtime.health = AsyncMock(return_value=True)
            transport.accept.return_value = str(uuid.uuid4())
            asyncio.run(runtime.dispatch_real([pilot,other],settings,legacy))
            self.assertEqual(legacy.await_count,1)
            self.assertEqual(transport.accept.await_count,1)
            restarted = ControlledRuntime(LegacyJournal(Path(directory)/"owners.sqlite3"),transport,runtime.organization,runtime.health)
            asyncio.run(restarted.dispatch_real([pilot],replace(settings,pilot_enabled=False,pilot_allowlist=frozenset()),legacy))
            self.assertEqual(legacy.await_count,1)
            self.assertEqual(transport.accept.await_count,1)
