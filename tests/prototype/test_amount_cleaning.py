import unittest

from tools.prototype_validators.amounts import AmountValidationError, clean_amount


class AmountCleaningTests(unittest.TestCase):
    def test_clean_valid_amounts(self):
        cases = {
            "1000": 1000,
            "1,000": 1000,
            "１０００": 1000,
            "600元": 600,
            " 1,200 元 ": 1200,
        }
        for raw, expected in cases.items():
            with self.subTest(raw=raw):
                self.assertEqual(clean_amount(raw), expected)

    def test_blank_returns_none(self):
        self.assertIsNone(clean_amount(""))
        self.assertIsNone(clean_amount("   "))
        self.assertIsNone(clean_amount(None))

    def test_invalid_does_not_become_zero(self):
        with self.assertRaises(AmountValidationError):
            clean_amount("abc")

    def test_negative_is_invalid(self):
        with self.assertRaises(AmountValidationError):
            clean_amount("-100")


if __name__ == "__main__":
    unittest.main()

