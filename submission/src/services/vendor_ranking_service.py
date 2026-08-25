from __future__ import annotations

from io import BytesIO

import pandas as pd


DEFAULT_VENDOR_COLUMN = "vendor_id"
LOWER_IS_BETTER_KEYWORDS = {
    "price",
    "cost",
    "risk",
    "delay",
    "late",
    "defect",
    "incident",
    "complaint",
}


class VendorRankingError(ValueError):
    """Raised when ranking input cannot be processed."""


def parse_weight_spec(weights_spec: str | None) -> dict[str, float] | None:
    """Parse weight spec string like `price:-0.5,quality:0.3,on_time:0.2`."""
    if not weights_spec:
        return None

    parsed: dict[str, float] = {}
    chunks = [chunk.strip() for chunk in weights_spec.split(",") if chunk.strip()]
    if not chunks:
        return None

    for chunk in chunks:
        if ":" not in chunk:
            raise VendorRankingError(
                f"Invalid weight segment '{chunk}'. Expected format: metric:weight"
            )
        metric, raw_weight = chunk.split(":", 1)
        metric = metric.strip()
        if not metric:
            raise VendorRankingError("Metric name cannot be empty in weight specification")
        try:
            parsed[metric] = float(raw_weight.strip())
        except ValueError as exc:  # noqa: BLE001
            raise VendorRankingError(
                f"Invalid numeric weight '{raw_weight}' for metric '{metric}'"
            ) from exc

    if all(weight == 0 for weight in parsed.values()):
        raise VendorRankingError("At least one metric weight must be non-zero")

    return parsed


def _is_lower_better(metric_name: str) -> bool:
    normalized = metric_name.lower()
    return any(keyword in normalized for keyword in LOWER_IS_BETTER_KEYWORDS)


def _default_weights(df: pd.DataFrame, vendor_column: str) -> dict[str, float]:
    numeric_cols = [
        column
        for column in df.columns
        if column != vendor_column and pd.api.types.is_numeric_dtype(df[column])
    ]
    if not numeric_cols:
        raise VendorRankingError("No numeric metric columns found for weighted ranking")

    base_weight = 1.0 / len(numeric_cols)
    weights: dict[str, float] = {}
    for column in numeric_cols:
        sign = -1.0 if _is_lower_better(column) else 1.0
        weights[column] = sign * base_weight
    return weights


def _normalize_column(series: pd.Series) -> pd.Series:
    min_val = series.min()
    max_val = series.max()
    if pd.isna(min_val) or pd.isna(max_val):
        return pd.Series([0.0] * len(series), index=series.index)
    if max_val == min_val:
        return pd.Series([1.0] * len(series), index=series.index)
    return (series - min_val) / (max_val - min_val)


def rank_vendors(
    df: pd.DataFrame,
    vendor_column: str = DEFAULT_VENDOR_COLUMN,
    weights: dict[str, float] | None = None,
) -> pd.DataFrame:
    """Rank vendors by weighted normalized scores.

    Weight sign controls direction:
    - Positive: higher metric is better
    - Negative: lower metric is better
    """
    if vendor_column not in df.columns:
        raise VendorRankingError(f"Missing required vendor column: '{vendor_column}'")

    ranking_weights = weights or _default_weights(df, vendor_column)
    metric_columns = list(ranking_weights.keys())

    missing_metrics = [column for column in metric_columns if column not in df.columns]
    if missing_metrics:
        missing_text = ", ".join(missing_metrics)
        raise VendorRankingError(f"Missing metric columns in CSV: {missing_text}")

    non_numeric = [
        column for column in metric_columns if not pd.api.types.is_numeric_dtype(df[column])
    ]
    if non_numeric:
        non_numeric_text = ", ".join(non_numeric)
        raise VendorRankingError(
            f"All weighted metrics must be numeric. Non-numeric columns: {non_numeric_text}"
        )

    aggregated = (
        df[[vendor_column] + metric_columns]
        .groupby(vendor_column, as_index=False)
        .mean(numeric_only=True)
    )

    weight_sum = sum(abs(weight) for weight in ranking_weights.values())
    if weight_sum == 0:
        raise VendorRankingError("Sum of absolute weights cannot be zero")

    normalized_weighted_scores: list[pd.Series] = []
    for metric in metric_columns:
        normalized = _normalize_column(aggregated[metric])
        weight = ranking_weights[metric]
        if weight < 0:
            normalized = 1 - normalized
        normalized_weighted_scores.append(normalized * (abs(weight) / weight_sum))

    aggregated["weighted_score"] = sum(normalized_weighted_scores)
    aggregated["rank"] = (
        aggregated["weighted_score"].rank(method="dense", ascending=False).astype(int)
    )

    # Keep ranking metadata for auditability.
    aggregated["weight_profile"] = ",".join(
        f"{metric}:{ranking_weights[metric]}" for metric in metric_columns
    )

    return aggregated.sort_values(["rank", "weighted_score"], ascending=[True, False]).reset_index(
        drop=True
    )


def rank_vendors_from_csv(
    csv_bytes: bytes | None = None,
    csv_path: str | None = None,
    vendor_column: str = DEFAULT_VENDOR_COLUMN,
    weights: dict[str, float] | None = None,
) -> pd.DataFrame:
    if csv_bytes is None and not csv_path:
        raise VendorRankingError("Provide either csv_bytes or csv_path")

    if csv_bytes is not None:
        source = BytesIO(csv_bytes)
        df = pd.read_csv(source)
    else:
        df = pd.read_csv(csv_path)

    return rank_vendors(df=df, vendor_column=vendor_column, weights=weights)
