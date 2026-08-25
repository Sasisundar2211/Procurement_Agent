from __future__ import annotations

import pandas as pd


def dataframe_to_records(df: pd.DataFrame) -> list[dict]:
    cleaned = df.replace([float("inf"), float("-inf")], None)
    cleaned = cleaned.where(pd.notnull(cleaned), None)
    return cleaned.to_dict(orient="records")
