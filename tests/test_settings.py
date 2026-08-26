import os
import pytest
from src.utils.settings import get_settings


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
