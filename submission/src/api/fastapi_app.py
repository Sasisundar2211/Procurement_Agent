"""Backward-compatible entrypoint.

Use `src.api.main:app` for new deployments.
"""

from src.api.main import app, create_app

__all__ = ["app", "create_app"]
