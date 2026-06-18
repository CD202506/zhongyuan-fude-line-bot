"""Amount cleaning helpers for prototype tests.

These helpers do not write data anywhere. They only normalize user-entered
amount text so prototype rules can be tested locally.
"""

from __future__ import annotations

import re
import unicodedata


class AmountValidationError(ValueError):
    """Raised when an amount cannot be safely parsed."""


def clean_amount(value: object) -> int | None:
    """Return a positive integer amount, or None for blank input.

    Rules:
    - Full-width digits are normalized.
    - Commas, spaces, and the unit "元" are ignored.
    - Non-blank unparseable input raises.
    - Negative amounts raise.
    """

    if value is None:
        return None

    text = unicodedata.normalize("NFKC", str(value)).strip()
    if not text:
        return None

    text = text.replace(",", "").replace(" ", "").replace("\u3000", "")
    text = re.sub(r"元$", "", text)

    if text.startswith("-"):
        raise AmountValidationError("Amount must not be negative")

    if not re.fullmatch(r"\d+", text):
        raise AmountValidationError(f"Invalid amount: {value!r}")

    return int(text)

