"""Safety scanners for prototype files and test data."""

from __future__ import annotations

import re
from pathlib import Path


SUSPICIOUS_PATTERNS = {
    "line_token": re.compile(r"(?i)(channel[_-]?access[_-]?token|bearer\s+[a-z0-9._-]{20,})"),
    "line_uid": re.compile(r"\bU[0-9a-f]{32}\b"),
    "secret": re.compile(r"(?i)(client_secret|channel_secret|private_key)"),
    "google_sheet_id": re.compile(r"\b[0-9A-Za-z_-]{44}\b"),
    "bank_account": re.compile(r"(銀行帳號|帳戶號碼)\s*[:：]\s*\d"),
    "real_receipt": re.compile(r"(收據號碼|receipt_id)\s*[:：]\s*[A-Z0-9-]{6,}"),
    "env_file": re.compile(r"(?i)\.env(?:\.local)?"),
}


ALLOWLIST_HINTS = (
    "placeholder",
    "欄位",
    "提醒",
    "不要",
    "不得",
    "不放",
    "不包含",
    "未包含",
    "範例",
    "example",
    "GOOGLE_SHEET_ID",
    "LINE_CHANNEL_ACCESS_TOKEN",
    "read or modify",
    "讀取或修改",
)


def scan_text(text: str) -> list[tuple[str, str]]:
    findings: list[tuple[str, str]] = []
    for name, pattern in SUSPICIOUS_PATTERNS.items():
        for match in pattern.finditer(text):
            line_start = text.rfind("\n", 0, match.start()) + 1
            line_end = text.find("\n", match.end())
            if line_end == -1:
                line_end = len(text)
            line = text[line_start:line_end].strip()
            line_lower = line.lower()
            if any(hint.lower() in line_lower for hint in ALLOWLIST_HINTS):
                continue
            findings.append((name, line))
    return findings


def scan_paths(paths: list[Path]) -> list[tuple[str, str, str]]:
    findings: list[tuple[str, str, str]] = []
    for path in paths:
        if path.name in {".env", ".env.local"}:
            findings.append(("env_file", str(path), "env file must not be scanned or used"))
            continue
        if not path.is_file():
            continue
        text = path.read_text(encoding="utf-8")
        for finding_type, line in scan_text(text):
            findings.append((finding_type, str(path), line))
    return findings
