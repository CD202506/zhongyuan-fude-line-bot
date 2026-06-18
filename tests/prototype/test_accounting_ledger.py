import unittest

from tools.prototype_validators.ledger import (
    LedgerValidationError,
    monthly_total,
    validate_income_relationship,
    validate_receipt_ids,
    validate_temple_visit_expense,
)


class AccountingLedgerTests(unittest.TestCase):
    def test_income_can_relate_to_devotee_records(self):
        validate_income_relationship(
            {
                "ledger_id": "ledger-001",
                "direction": "income",
                "related_type": "repayment",
                "related_devotee_id": "devotee-001",
                "amount": 1000,
            }
        )

    def test_temple_visit_expense_requires_visit(self):
        validate_temple_visit_expense(
            {
                "ledger_id": "ledger-002",
                "direction": "expense",
                "related_type": "temple_visit",
                "related_visit_id": "visit-001",
                "amount": 800,
            }
        )
        with self.assertRaises(LedgerValidationError):
            validate_temple_visit_expense({"direction": "expense", "related_type": "manual", "amount": 800})

    def test_void_records_are_excluded_from_monthly_total(self):
        logs = [
            {"ledger_id": "l1", "direction": "income", "related_type": "repayment", "amount": 1000, "monthly_report_period": "2026-06", "status": "active"},
            {"ledger_id": "l2", "direction": "expense", "related_type": "temple_visit", "amount": 300, "monthly_report_period": "2026-06", "status": "active"},
            {"ledger_id": "l3", "direction": "income", "related_type": "manual", "amount": 9999, "monthly_report_period": "2026-06", "status": "void"},
        ]
        self.assertEqual(monthly_total(logs, "2026-06"), 700)

    def test_duplicate_receipt_id_is_blocked(self):
        logs = [
            {"ledger_id": "l1", "receipt_id": "receipt-demo-001"},
            {"ledger_id": "l2", "receipt_id": "receipt-demo-001"},
        ]
        with self.assertRaises(LedgerValidationError):
            validate_receipt_ids(logs)

    def test_invalid_atomic_log_is_blocked(self):
        with self.assertRaises(LedgerValidationError):
            monthly_total([{"ledger_id": "l1", "direction": "income", "related_type": "manual", "amount": -1, "monthly_report_period": "2026-06"}], "2026-06")


if __name__ == "__main__":
    unittest.main()

