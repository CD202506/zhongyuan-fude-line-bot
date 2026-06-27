from dataclasses import dataclass
import os


@dataclass(frozen=True)
class Settings:
    service_name: str = "web_admin_api"
    database_url: str | None = None
    allowed_origins: tuple[str, ...] = ()
    test_mode: bool = True


def get_settings() -> Settings:
    origins = os.getenv("WEB_ADMIN_ALLOWED_ORIGINS", "")
    return Settings(
        database_url=os.getenv("DATABASE_URL"),
        allowed_origins=tuple(item.strip() for item in origins.split(",") if item.strip()),
        test_mode=os.getenv("WEB_ADMIN_TEST_MODE", "true").lower() == "true",
    )
