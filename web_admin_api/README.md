# Zhongyuan Fude Web Admin API

`web_admin_api/` is the planned FastAPI service for the Web Admin database-backed MVP.

This service is intentionally separate from the existing LINE Bot runtime. It is planned for a future Render service such as `zhongyuan-fude-web-admin-api`, backed by a staging PostgreSQL database.

Current status:

- Skeleton only
- No deployment
- No database connection required for import
- No `.env` committed
- No secret values in repo
- No LINE Bot integration
- No Google Sheets or AppSheet integration

Planned local run command after dependencies are installed:

```powershell
uvicorn app.main:app --reload
```
