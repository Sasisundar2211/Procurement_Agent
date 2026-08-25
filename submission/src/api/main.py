from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.api.router import api_router
from src.utils.logging_config import configure_logging
from src.utils.settings import PROJECT_ROOT, get_settings


def _resolve_static_dir() -> Path:
    candidates = [
        PROJECT_ROOT / "src" / "api" / "static",
        PROJECT_ROOT / "frontend" / "dist",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return candidates[0]


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    allow_credentials = settings.cors_origins != ["*"]

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=allow_credentials,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_prefix)

    static_dir = _resolve_static_dir()
    if static_dir.exists():
        app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")

        @app.get("/", include_in_schema=False)
        async def read_index() -> FileResponse:
            index_path = static_dir / "index.html"
            if not index_path.exists():
                raise HTTPException(status_code=404, detail="index.html not found")
            return FileResponse(index_path)

        @app.get("/leaks.html", include_in_schema=False)
        async def read_leaks_page() -> FileResponse:
            leaks_path = static_dir / "leaks.html"
            if leaks_path.exists():
                return FileResponse(leaks_path)

            index_path = static_dir / "index.html"
            if not index_path.exists():
                raise HTTPException(status_code=404, detail="No UI assets found")
            return FileResponse(index_path)

    return app


app = create_app()
