"""Backward-compatible detector wrapper.

The production implementation now lives in `src.services.detection_service`.
"""

from sqlalchemy.engine import Engine

from src.services.detection_service import detect_public_only as _detect_public_only
from src.utils.database import get_engine

# Kept for compatibility with scripts/tests that monkeypatch this symbol.
engine: Engine = get_engine()


def detect_public_only(drift_threshold: float | None = None):
    return _detect_public_only(drift_threshold=drift_threshold, engine_override=engine)


def evaluate_with_private_labels():
    # Reserved for future extension.
    return None
