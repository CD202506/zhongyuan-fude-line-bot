from fastapi import APIRouter

from ..config import get_settings
from ..db import database_configured, get_database_mode, get_local_sqlite_path, postgres_available
from ..schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    mode = get_database_mode()
    if mode == "postgres":
        available = postgres_available()
        return HealthResponse(
            status="ok" if available else "degraded",
            service="web_admin_api",
            mode=mode,
            database_status="postgres_available" if available else "postgres_unavailable",
        )

    return HealthResponse(status="ok", service="web_admin_api", mode=mode, database_status="local_sqlite")


@router.get("/health/details")
def get_health_details() -> dict[str, object]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.service_name,
        "mode": get_database_mode(),
        "database_configured": database_configured(),
        "database_status": get_health().database_status,
        "local_sqlite_path": str(get_local_sqlite_path()),
        "test_mode": settings.test_mode,
    }
