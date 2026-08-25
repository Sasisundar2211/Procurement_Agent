from __future__ import annotations

import logging
from typing import Any

import pandas as pd
from sqlalchemy import inspect
from sqlalchemy.engine import Engine

from src.tools.llm_client import summarize_drift_with_gemini
from src.utils.database import get_engine
from src.utils.settings import get_settings

logger = logging.getLogger(__name__)

RESULT_COLUMNS = [
    "po_id",
    "vendor_id",
    "item_id",
    "unit_price",
    "qty",
    "total",
    "date",
    "contract_id",
    "contract_unit_price",
    "price_drift",
    "gemini_summary",
]


def _empty_result_df() -> pd.DataFrame:
    return pd.DataFrame(columns=RESULT_COLUMNS)


def _normalize_threshold(drift_threshold: float | None) -> float:
    settings = get_settings()
    percent = settings.default_drift_threshold_percent if drift_threshold is None else drift_threshold
    return 1 + (percent / 100.0)


def _read_tables(engine: Engine) -> tuple[pd.DataFrame, pd.DataFrame]:
    pos_df = pd.read_sql("select * from pos", engine)
    contracts_df = pd.read_sql("select * from contracts", engine)
    return pos_df, contracts_df


def _build_summary(drifts: pd.DataFrame) -> pd.DataFrame:
    settings = get_settings()
    drifts = drifts.sort_values("price_drift", ascending=False).copy()
    drifts["gemini_summary"] = None

    max_summaries = min(settings.max_ai_summaries, len(drifts))
    for idx in drifts.index[:max_summaries]:
        row = drifts.loc[idx]
        drifts.at[idx, "gemini_summary"] = summarize_drift_with_gemini(
            row["contract_unit_price"],
            row["unit_price"],
        )

    drifts["gemini_summary"] = drifts["gemini_summary"].fillna(
        "Drift detected (AI summary skipped for speed)"
    )
    return drifts


def detect_public_only(
    drift_threshold: float | None = None,
    engine_override: Engine | None = None,
) -> pd.DataFrame:
    engine = engine_override or get_engine()
    drift_ratio = _normalize_threshold(drift_threshold)

    inspector = inspect(engine)
    if not inspector.has_table("pos") or not inspector.has_table("contracts"):
        logger.warning("Required tables not found in database")
        return _empty_result_df()

    try:
        pos_df, contracts_df = _read_tables(engine)
    except Exception as exc:  # noqa: BLE001
        logger.exception("Failed to read source tables: %s", exc)
        return _empty_result_df()

    if pos_df.empty or contracts_df.empty:
        return _empty_result_df()

    pos_df["contract_id"] = pos_df["contract_id"].fillna("").astype(str)
    contracts_df["contract_id"] = contracts_df["contract_id"].fillna("").astype(str)

    merged_df = pd.merge(pos_df, contracts_df, on="contract_id", how="left", suffixes=("_po", "_contract"))
    if "contract_unit_price" not in merged_df.columns:
        return _empty_result_df()

    contracted_pos = merged_df[merged_df["contract_unit_price"].notna()].copy()
    contracted_pos = contracted_pos[contracted_pos["contract_unit_price"] > 0].copy()
    if contracted_pos.empty:
        return _empty_result_df()

    contracted_pos["price_drift"] = contracted_pos["unit_price"] / contracted_pos["contract_unit_price"]
    drifts = contracted_pos[contracted_pos["price_drift"] > drift_ratio].copy()
    if drifts.empty:
        return _empty_result_df()

    drifts = _build_summary(drifts)

    drifts.rename(
        columns={
            "vendor_id_po": "vendor_id",
            "item_id_po": "item_id",
        },
        inplace=True,
    )

    for column in RESULT_COLUMNS:
        if column not in drifts.columns:
            drifts[column] = None

    drifts = drifts.replace([float("inf"), float("-inf")], None)
    drifts = drifts.where(pd.notnull(drifts), None)

    return drifts[RESULT_COLUMNS]


def detect_public_only_records(
    drift_threshold: float | None = None,
    engine_override: Engine | None = None,
) -> list[dict[str, Any]]:
    return detect_public_only(
        drift_threshold=drift_threshold,
        engine_override=engine_override,
    ).to_dict(orient="records")
