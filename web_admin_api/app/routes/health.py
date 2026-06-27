from fastapi import APIRouter

from ..db import database_configured
from ..schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    return HealthResponse(status="ok", service="web_admin_api")


@router.get("/health/details")
def get_health_details() -> dict[str, object]:
    return {"status": "ok", "service": "web_admin_api", "database_configured": database_configured()}
