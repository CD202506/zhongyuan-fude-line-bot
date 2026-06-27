from fastapi import APIRouter

from ..config import get_settings
from ..db import database_configured, get_database_mode, get_local_sqlite_path
from ..schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    mode = get_database_mode()
    database_status = "configured" if database_configured() else "local_sqlite"
    return HealthResponse(status="ok", service="web_admin_api", mode=mode, database_status=database_status)


@router.get("/health/details")
def get_health_details() -> dict[str, object]:
    settings = get_settings()
    return {
        "status": "ok",
        "service": settings.service_name,
        "mode": get_database_mode(),
        "database_configured": database_configured(),
        "local_sqlite_path": str(get_local_sqlite_path()),
        "test_mode": settings.test_mode,
    }
