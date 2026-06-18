import unittest
from pathlib import Path

from tools.prototype_validators.sanitizers import scan_paths


class MockDataSafetyTests(unittest.TestCase):
    def test_web_admin_files_do_not_contain_real_secrets_or_sensitive_values(self):
        root = Path(__file__).resolve().parents[2]
        paths = [
            root / "web_admin_mvp" / "app.js",
            root / "web_admin_mvp" / "mockData.js",
            root / "web_admin_mvp" / "README.md",
            root / "docs" / "PROTOTYPE_SAFETY_TEST_PLAN.md",
        ]
        findings = scan_paths(paths)
        self.assertEqual(findings, [])


if __name__ == "__main__":
    unittest.main()

