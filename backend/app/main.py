from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, instruments, procedures, reports, users
from app.api.health import router as health_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="MetraLab API",
        version="0.1.0",
        description="Internal OIML R76 test report service",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Content-Type", "Authorization", "Accept", "X-CSRF-Token"],
    )
    app.include_router(health_router, prefix="/api")
    app.include_router(auth.router, prefix="/api/auth")
    app.include_router(instruments.router, prefix="/api/instruments")
    app.include_router(procedures.router, prefix="/api/procedures")
    app.include_router(reports.router, prefix="/api/reports")
    app.include_router(users.router, prefix="/api/users")
    return app


app = create_app()
