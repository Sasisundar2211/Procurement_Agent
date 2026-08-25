from __future__ import annotations

import os
from io import BytesIO

import pandas as pd
import requests

DEFAULT_MODEL = "gpt-4o-mini"
DEFAULT_TOP_N = 3
OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions"


class VendorExplanationError(RuntimeError):
    """Raised when vendor explanation cannot be generated."""


def _get_openai_api_key() -> str:
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
    if not api_key:
        raise VendorExplanationError(
            "OPENAI_API_KEY is not configured. Set it in your environment or .env file."
        )
    return api_key


def _validate_ranked_columns(df: pd.DataFrame) -> None:
    required_columns = {"vendor_id", "rank", "weighted_score"}
    missing = sorted(required_columns - set(df.columns))
    if missing:
        missing_text = ", ".join(missing)
        raise VendorExplanationError(
            f"Ranked vendor results must include columns: vendor_id, rank, weighted_score. Missing: {missing_text}"
        )


def _build_business_context(ranked_df: pd.DataFrame, top_n: int) -> str:
    ranked = ranked_df.copy()
    _validate_ranked_columns(ranked)

    ranked = ranked.sort_values(["rank", "weighted_score"], ascending=[True, False]).reset_index(
        drop=True
    )

    total_vendors = len(ranked)
    if total_vendors == 0:
        raise VendorExplanationError("Ranked vendor input is empty")

    top_slice = ranked.head(max(1, top_n))
    top_rows = [
        f"rank={int(row['rank'])}, vendor={row['vendor_id']}, score={float(row['weighted_score']):.3f}"
        for _, row in top_slice.iterrows()
    ]

    top_score = float(ranked.iloc[0]["weighted_score"])
    second_score = float(ranked.iloc[1]["weighted_score"]) if total_vendors > 1 else top_score
    bottom_score = float(ranked.iloc[-1]["weighted_score"])

    return (
        f"total_vendors={total_vendors}\n"
        f"top_vendors:\n- "
        + "\n- ".join(top_rows)
        + "\n"
        f"score_spread_top_vs_second={top_score - second_score:.3f}\n"
        f"score_spread_top_vs_bottom={top_score - bottom_score:.3f}"
    )


def generate_vendor_ranking_explanation(
    ranked_df: pd.DataFrame,
    top_n: int = DEFAULT_TOP_N,
    model: str | None = None,
    timeout_seconds: int = 30,
) -> str:
    if top_n < 1:
        raise VendorExplanationError("top_n must be >= 1")

    api_key = _get_openai_api_key()
    selected_model = model or os.getenv("OPENAI_VENDOR_EXPLANATION_MODEL", DEFAULT_MODEL)

    context = _build_business_context(ranked_df, top_n=top_n)

    payload = {
        "model": selected_model,
        "temperature": 0.2,
        "max_tokens": 120,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a procurement analytics assistant. "
                    "Write a short, business-focused explanation of vendor ranking results. "
                    "Use exactly 2 sentences, plain language, no bullet points."
                ),
            },
            {
                "role": "user",
                "content": (
                    "Given these ranking facts, summarize the key takeaway for business stakeholders. "
                    "Focus on leader strength and performance gap risk.\n\n"
                    f"{context}"
                ),
            },
        ],
    }

    response = requests.post(
        OPENAI_CHAT_COMPLETIONS_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=timeout_seconds,
    )

    try:
        response.raise_for_status()
    except requests.RequestException as exc:
        raise VendorExplanationError(f"OpenAI API request failed: {exc}") from exc

    data = response.json()
    choices = data.get("choices", [])
    if not choices:
        raise VendorExplanationError("OpenAI response did not include any choices")

    message = choices[0].get("message", {})
    content = message.get("content")
    if not isinstance(content, str) or not content.strip():
        raise VendorExplanationError("OpenAI response did not include explanation text")

    return " ".join(content.split())


def explain_ranked_vendors_from_csv(
    csv_bytes: bytes | None = None,
    csv_path: str | None = None,
    top_n: int = DEFAULT_TOP_N,
    model: str | None = None,
) -> str:
    if csv_bytes is None and not csv_path:
        raise VendorExplanationError("Provide either csv_bytes or csv_path")

    if csv_bytes is not None:
        ranked_df = pd.read_csv(BytesIO(csv_bytes))
    else:
        ranked_df = pd.read_csv(csv_path)

    return generate_vendor_ranking_explanation(
        ranked_df=ranked_df,
        top_n=top_n,
        model=model,
    )
