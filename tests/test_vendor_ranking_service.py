import pandas as pd
import pytest

from src.services.vendor_ranking_service import (
    VendorRankingError,
    _is_lower_better,
    parse_weight_spec,
    rank_vendors,
)


def test_rank_vendors_with_weight_direction():
    df = pd.DataFrame(
        [
            {"vendor_id": "A", "unit_price": 90, "quality_score": 80, "on_time_rate": 95},
            {"vendor_id": "A", "unit_price": 90, "quality_score": 80, "on_time_rate": 95},
            {"vendor_id": "B", "unit_price": 110, "quality_score": 95, "on_time_rate": 90},
        ]
    )

    ranked = rank_vendors(
        df,
        weights={"unit_price": -0.5, "quality_score": 0.3, "on_time_rate": 0.2},
    )

    assert ranked.iloc[0]["vendor_id"] == "A"
    assert ranked.iloc[0]["rank"] == 1
    assert ranked.iloc[1]["vendor_id"] == "B"
    assert ranked.iloc[1]["rank"] == 2


def test_parse_weight_spec_validation():
    with pytest.raises(VendorRankingError):
        parse_weight_spec("unit_price")

    with pytest.raises(VendorRankingError):
        parse_weight_spec("unit_price:foo")


def test_rank_vendors_requires_vendor_column():
    df = pd.DataFrame([{"supplier": "A", "unit_price": 100}])
    with pytest.raises(VendorRankingError):
        rank_vendors(df, vendor_column="vendor_id")


@pytest.mark.parametrize(
    "metric_name, expected",
    [
        # Lower-is-better keywords (exact match)
        ("price", True),
        ("cost", True),
        ("risk", True),
        ("delay", True),
        ("late", True),
        ("defect", True),
        ("incident", True),
        ("complaint", True),
        # Case insensitivity & compounding
        ("UNIT_PRICE", True),
        ("Total_Cost", True),
        ("Risk_Score", True),
        ("DELAY_DAYS", True),
        ("Late_Delivery_Count", True),
        ("DefectRate", True),
        ("INCIDENT_COUNT", True),
        ("Customer_Complaints", True),
        ("  price  ", True),
        ("cost/unit", True),
        ("risk-level", True),
        # Higher-is-better metrics (should return False)
        ("quality_score", False),
        ("on_time_rate", False),
        ("accuracy", False),
        ("reliability", False),
        ("speed", False),
        ("uptime_percentage", False),
        ("csat", False),
        # Edge cases
        ("", False),
        ("   ", False),
        ("12345", False),
        ("---", False),
    ],
)
def test_is_lower_better(metric_name: str, expected: bool):
    assert _is_lower_better(metric_name) == expected
