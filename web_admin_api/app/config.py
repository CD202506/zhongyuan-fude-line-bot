from dataclasses import dataclass
import os
from pathlib import Path


API_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ALLOWED_ORIGINS = (
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:4173",
    "http://localhost:4173",
)


@dataclass(frozen=True)
class Settings:
    service_name: str = "web_admin_api"
    database_url: str | None = None
    local_sqlite_path: Path = API_ROOT / "local_dev.sqlite3"
    allowed_origins: tuple[str, ...] = ()
    test_mode: bool = True


def get_settings() -> Settings:
    origins = os.getenv("WEB_ADMIN_ALLOWED_ORIGINS", "")
    allowed_origins = tuple(item.strip() for item in origins.split(",") if item.strip()) or DEFAULT_ALLOWED_ORIGINS
    return Settings(
        database_url=os.getenv("DATABASE_URL"),
        local_sqlite_path=Path(os.getenv("WEB_ADMIN_LOCAL_SQLITE_PATH", API_ROOT / "local_dev.sqlite3")),
        allowed_origins=allowed_origins,
        test_mode=os.getenv("WEB_ADMIN_TEST_MODE", "true").lower() == "true",
    )
