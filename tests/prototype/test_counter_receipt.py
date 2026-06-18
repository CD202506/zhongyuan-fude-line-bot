import unittest

from tools.prototype_validators.amounts import clean_amount
from tools.prototype_validators.relationships import validate_devotee_relationship


class CounterReceiptTests(unittest.TestCase):
    def test_counter_receipt_links_devotee_handler_and_ledger(self):
        receipt = {
            "devotee_id": "devotee-001",
            "action": "還發財金",
            "amount_text": "1,000元",
            "handled_by": "team-001",
            "create_ledger_draft": True,
        }
        validate_devotee_relationship(receipt, {"devotee-001"})
        self.assertEqual(clean_amount(receipt["amount_text"]), 1000)
        self.assertTrue(receipt["handled_by"].startswith("team-"))
        self.assertTrue(receipt["create_ledger_draft"])


if __name__ == "__main__":
    unittest.main()

