from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_local_database
from .routes import audit, health, modules, records


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Zhongyuan Fude Web Admin API")
    if settings.allowed_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(settings.allowed_origins),
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.on_event("startup")
    def on_startup() -> None:
        if not settings.database_url:
            init_local_database()

    app.include_router(health.router, prefix="/api")
    app.include_router(modules.router, prefix="/api")
    app.include_router(records.router, prefix="/api")
    app.include_router(audit.router, prefix="/api")
    return app


app = create_app()
