from __future__ import annotations

from fastapi import APIRouter, File, HTTPException, Query, UploadFile

from src.models.schemas import VendorRankResult, VendorRankingExplanationResponse
from src.services.vendor_explanation_service import (
    VendorExplanationError,
    explain_ranked_vendors_from_csv,
)
from src.services.vendor_ranking_service import (
    VendorRankingError,
    parse_weight_spec,
    rank_vendors_from_csv,
)

router = APIRouter()


@router.post("/vendors/rank", response_model=list[VendorRankResult])
async def rank_vendors_csv(
    file: UploadFile = File(...),
    vendor_column: str = Query(default="vendor_id"),
    weights: str | None = Query(
        default=None,
        description="Format: metric:weight,metric:weight. Negative means lower is better.",
    ),
) -> list[VendorRankResult]:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded CSV is empty")

    try:
        ranking_weights = parse_weight_spec(weights)
        ranked_df = rank_vendors_from_csv(
            csv_bytes=payload,
            vendor_column=vendor_column,
            weights=ranking_weights,
        )
    except VendorRankingError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Ranking failed: {exc}") from exc

    records = ranked_df.to_dict(orient="records")
    return [VendorRankResult.model_validate(record) for record in records]


@router.post("/vendors/explain-ranking", response_model=VendorRankingExplanationResponse)
async def explain_vendor_ranking(
    file: UploadFile = File(...),
    top_n: int = Query(default=3, ge=1, le=10),
    model: str | None = Query(
        default=None,
        description="Optional OpenAI model override (default: OPENAI_VENDOR_EXPLANATION_MODEL or gpt-4o-mini).",
    ),
) -> VendorRankingExplanationResponse:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file")

    payload = await file.read()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded CSV is empty")

    try:
        explanation = explain_ranked_vendors_from_csv(
            csv_bytes=payload,
            top_n=top_n,
            model=model,
        )
    except VendorExplanationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Explanation generation failed: {exc}") from exc

    return VendorRankingExplanationResponse(explanation=explanation)
