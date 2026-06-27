from .config import get_settings


def get_database_url() -> str | None:
    return get_settings().database_url


def database_configured() -> bool:
    return bool(get_database_url())
