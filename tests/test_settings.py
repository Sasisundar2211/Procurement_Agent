import os
import pytest
from dataclasses import FrozenInstanceError

from src.utils.settings import Settings, get_settings


@pytest.fixture(autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_cors_origins_default(monkeypatch):
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.cors_origins == [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_cors_origins_custom(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "https://example.com, https://app.example.com")
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.cors_origins == ["https://example.com", "https://app.example.com"]


def test_cors_origins_empty(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "")
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.cors_origins == []


def test_cors_origins_wildcard_explicit(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "*")
    get_settings.cache_clear()
    settings = get_settings()
    assert settings.cors_origins == ["*"]


def test_get_settings_defaults(monkeypatch):
    monkeypatch.delenv("APP_NAME", raising=False)
    monkeypatch.delenv("APP_VERSION", raising=False)
    monkeypatch.delenv("API_PREFIX", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.delenv("DEFAULT_DRIFT_THRESHOLD_PERCENT", raising=False)
    monkeypatch.delenv("MAX_AI_SUMMARIES", raising=False)
    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    monkeypatch.delenv("LOG_LEVEL", raising=False)
    monkeypatch.delenv("VERCEL", raising=False)

    settings = get_settings()

    assert settings.app_name == "Procurement Agent API"
    assert settings.app_version == "1.0.0"
    assert settings.api_prefix == "/api"
    assert settings.database_url == "sqlite:///data/procure.db"
    assert settings.default_drift_threshold_percent == 5.0
    assert settings.max_ai_summaries == 5
    assert settings.log_level == "INFO"


def test_get_settings_custom_values(monkeypatch):
    monkeypatch.setenv("APP_NAME", "Test Procurement Agent")
    monkeypatch.setenv("APP_VERSION", "2.0.0")
    monkeypatch.setenv("API_PREFIX", "/api/v1")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///test.db")
    monkeypatch.setenv("DEFAULT_DRIFT_THRESHOLD_PERCENT", "10.5")
    monkeypatch.setenv("MAX_AI_SUMMARIES", "20")
    monkeypatch.setenv("CORS_ORIGINS", "https://example.com, https://test.com")
    monkeypatch.setenv("LOG_LEVEL", "DEBUG")

    settings = get_settings()

    assert settings.app_name == "Test Procurement Agent"
    assert settings.app_version == "2.0.0"
    assert settings.api_prefix == "/api/v1"
    assert settings.database_url == "sqlite:///test.db"
    assert settings.default_drift_threshold_percent == 10.5
    assert settings.max_ai_summaries == 20
    assert settings.cors_origins == ["https://example.com", "https://test.com"]
    assert settings.log_level == "DEBUG"


def test_database_url_vercel_fallback(monkeypatch):
    monkeypatch.delenv("DATABASE_URL", raising=False)
    monkeypatch.setenv("VERCEL", "1")

    settings = get_settings()
    assert settings.database_url == "sqlite:////tmp/procure.db"


def test_settings_immutability():
    settings = get_settings()

    with pytest.raises((FrozenInstanceError, AttributeError)):
        settings.app_name = "New Name"
