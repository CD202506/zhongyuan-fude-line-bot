# Zhongyuan Fude Web Admin API

`web_admin_api/` is the planned FastAPI service for the Web Admin database-backed MVP.

This service is intentionally separate from the existing LINE Bot runtime. It is planned for a future Render service such as `zhongyuan-fude-web-admin-api`, backed by a staging PostgreSQL database.

Current status:

- Local CRUD baseline
- SQLite fallback at `web_admin_api/local_dev.sqlite3` when `DATABASE_URL` is not set
- No deployment
- No `.env` committed
- No secret values in repo
- No LINE Bot integration
- No Google Sheets or AppSheet integration

Local setup after dependencies are installed:

```powershell
python scripts/init_local_db.py
python -m uvicorn app.main:app --reload
```

Render deployment preparation:

```powershell
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required environment variable names for the future Render service:

- `DATABASE_URL`
- `WEB_ADMIN_ALLOWED_ORIGINS`
- `WEB_ADMIN_TEST_MODE`
- `WEB_ADMIN_TEST_ACCESS_CODE`

Do not commit real environment values or secrets. When `DATABASE_URL` is not set,
the service keeps using the local SQLite fallback. PostgreSQL migrations can be
checked with:

```powershell
python scripts/run_migrations.py
```

A19 only prepares PostgreSQL deployment readiness and migration execution. The
runtime CRUD path still uses SQLite locally; PostgreSQL CRUD is planned for a
later step.

Smoke test from the repo root while the API is running:

```powershell
python web_admin_api/scripts/smoke_test.py
```
