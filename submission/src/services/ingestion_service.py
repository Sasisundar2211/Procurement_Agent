from __future__ import annotations

from pathlib import Path

import pandas as pd
from sqlalchemy.engine import Engine

from src.utils.database import get_engine
from src.utils.settings import PROJECT_ROOT


class IngestionError(RuntimeError):
    pass


def _resolve_input_file(name: str) -> Path:
    candidates = [
        PROJECT_ROOT / "data" / "public" / name,
        PROJECT_ROOT / "data" / name,
    ]
    for path in candidates:
        if path.exists():
            return path
    raise IngestionError(f"Could not find required data file: {name}")


def ingest_public_data(engine_override: Engine | None = None) -> None:
    engine = engine_override or get_engine()

    contracts_df = pd.read_csv(_resolve_input_file("contracts.csv"))
    pos_df = pd.read_csv(_resolve_input_file("pos.csv"))

    contracts_df.to_sql("contracts", engine, if_exists="replace", index=False)
    pos_df.to_sql("pos", engine, if_exists="replace", index=False)
