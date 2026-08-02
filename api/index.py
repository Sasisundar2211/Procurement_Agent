"""Vercel ASGI entrypoint for the Procurement API."""

from src.api.main import app

__all__ = ["app"]
