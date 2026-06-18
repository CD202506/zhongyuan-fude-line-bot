"""Ledger validators for local-only account-flow prototype tests."""

from __future__ import annotations

from collections.abc import Iterable


class LedgerValidationError(ValueError):
    """Raised when prototype ledger data is inconsistent."""


ALLOWED_RELATED_TYPES = {
    "devotee",
    "fortune_money",
    "peace_turtle",
    "repayment",
    "temple_visit",
    "event",
    "announcement",
    "manual",
}


def validate_atomic_log(log: dict) -> None:
    if not log.get("ledger_id"):
        raise LedgerValidationError("Ledger log requires ledger_id")
    if log.get("direction") not in {"income", "expense"}:
        raise LedgerValidationError("Ledger direction must be income or expense")
    if log.get("related_type") not in ALLOWED_RELATED_TYPES:
        raise LedgerValidationError("Unsupported related_type")
    if log.get("amount", 0) <= 0:
        raise LedgerValidationError("Ledger amount must be positive")


def validate_receipt_ids(logs: Iterable[dict]) -> None:
    seen: set[str] = set()
    for log in logs:
        receipt_id = log.get("receipt_id")
        if not receipt_id:
            continue
        if receipt_id in seen:
            raise LedgerValidationError(f"Duplicate receipt_id: {receipt_id}")
        seen.add(receipt_id)


def validate_income_relationship(log: dict) -> None:
    if log.get("direction") != "income":
        raise LedgerValidationError("Expected income log")
    if log.get("related_type") not in {"devotee", "fortune_money", "peace_turtle", "repayment"}:
        raise LedgerValidationError("Devotee income must relate to devotee records")
    if not (log.get("related_devotee_id") or log.get("related_id")):
        raise LedgerValidationError("Devotee income requires a related id")


def validate_temple_visit_expense(log: dict) -> None:
    if log.get("direction") != "expense":
        raise LedgerValidationError("Expected expense log")
    if log.get("related_type") != "temple_visit" or not log.get("related_visit_id"):
        raise LedgerValidationError("Temple visit expense requires related_visit_id")


def monthly_total(logs: Iterable[dict], period: str) -> int:
    total = 0
    for log in logs:
        validate_atomic_log(log)
        if log.get("monthly_report_period") != period:
            continue
        if log.get("status") == "void":
            continue
        amount = log["amount"]
        total += amount if log["direction"] == "income" else -amount
    return total

