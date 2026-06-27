from fastapi import FastAPI

from .routes import audit, health, modules, records


def create_app() -> FastAPI:
    app = FastAPI(title="Zhongyuan Fude Web Admin API")
    app.include_router(health.router, prefix="/api")
    app.include_router(modules.router, prefix="/api")
    app.include_router(records.router, prefix="/api")
    app.include_router(audit.router, prefix="/api")
    return app


app = create_app()
