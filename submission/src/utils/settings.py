from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    app_name: str
    app_version: str
    api_prefix: str
    database_url: str
    default_drift_threshold_percent: float
    max_ai_summaries: int
    cors_origins: list[str]
    log_level: str


@lru_cache
def get_settings() -> Settings:
    raw_origins = os.getenv("CORS_ORIGINS", "*")
    cors_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    return Settings(
        app_name=os.getenv("APP_NAME", "Procurement Agent API"),
        app_version=os.getenv("APP_VERSION", "1.0.0"),
        api_prefix=os.getenv("API_PREFIX", "/api"),
        database_url=os.getenv(
            "DATABASE_URL",
            "sqlite:////tmp/procure.db" if os.getenv("VERCEL") else "sqlite:///data/procure.db",
        ),
        default_drift_threshold_percent=float(os.getenv("DEFAULT_DRIFT_THRESHOLD_PERCENT", "5")),
        max_ai_summaries=int(os.getenv("MAX_AI_SUMMARIES", "5")),
        cors_origins=cors_origins or ["*"],
        log_level=os.getenv("LOG_LEVEL", "INFO"),
    )
