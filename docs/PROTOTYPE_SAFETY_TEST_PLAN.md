# 0.8.0A-3 Prototype Safety Test Harness

## Purpose

This document describes the local Python validation harness for the Web Admin V2 prototype.

The harness checks prototype data rules before any future adapter or formal data source work:

- Amount cleaning.
- Permission boundaries.
- Devotee record relationships.
- Temple / visit / announcement relationships.
- Accounting ledger rules.
- Counter receipt flow.
- Duty roster rules.
- Local mock data safety.
- Label / master-data classification.

## Safety Boundary

This stage is local-only.

It does not:

- Connect to Google Sheets.
- Write to any Google Sheets file.
- Modify Render.
- Modify LINE Developers Webhook.
- Modify production LINE Bot runtime.
- Read or modify `.env`, `.env.local`, or secrets.
- Deploy.

The tests validate mock / dev-like prototype data and rules only.

## Run

From the repository root:

```powershell
python -m unittest discover tests/prototype
node --check web_admin_mvp\app.js
node --check web_admin_mvp\mockData.js
```

## Notes

The repository does not currently include pytest as a project dependency, so this harness uses Python standard library `unittest`.

The safety scanner may encounter words such as `.env`, `GOOGLE_SHEET_ID`, `line_uid`, `token`, or `secret` in documentation or placeholder text. Those are allowed only when they are clearly safety reminders, placeholder names, or field names, not actual values.
