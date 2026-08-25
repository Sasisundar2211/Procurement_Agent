#!/usr/bin/env python3
from __future__ import annotations

import sys
from pathlib import Path

import pandas as pd
import streamlit as st
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env")

from src.services.vendor_explanation_service import (  # noqa: E402
    VendorExplanationError,
    generate_vendor_ranking_explanation,
)
from src.services.vendor_ranking_service import (  # noqa: E402
    VendorRankingError,
    parse_weight_spec,
    rank_vendors,
)

st.set_page_config(
    page_title="Vendor Ranking Dashboard",
    page_icon="📊",
    layout="wide",
)

st.title("Vendor Ranking Dashboard")
st.caption("Upload a CSV, rank vendors with weighted scoring, and generate a short business explanation.")

with st.sidebar:
    st.header("Ranking Settings")
    vendor_column = st.text_input("Vendor column", value="vendor_id")
    weights_text = st.text_input(
        "Metric weights",
        value="",
        help=(
            "Optional format: unit_price:-0.5,on_time_rate:0.3,quality_score:0.2. "
            "Positive means higher is better; negative means lower is better."
        ),
    )
    top_n = st.slider("Top vendors to summarize", min_value=1, max_value=10, value=3)
    model_override = st.text_input("OpenAI model override (optional)", value="")

uploaded_file = st.file_uploader("Upload vendor CSV", type=["csv"])

if "ranked_df" not in st.session_state:
    st.session_state.ranked_df = None
if "explanation" not in st.session_state:
    st.session_state.explanation = ""

if uploaded_file:
    try:
        input_df = pd.read_csv(uploaded_file)
    except Exception as exc:  # noqa: BLE001
        st.error(f"Could not read CSV: {exc}")
        st.stop()

    st.subheader("Input Preview")
    st.dataframe(input_df.head(50), use_container_width=True)

    if st.button("Rank Vendors", type="primary"):
        try:
            weight_map = parse_weight_spec(weights_text or None)
            ranked_df = rank_vendors(
                df=input_df,
                vendor_column=vendor_column,
                weights=weight_map,
            )
            st.session_state.ranked_df = ranked_df
            st.session_state.explanation = ""
            st.success(f"Ranked {len(ranked_df)} vendors successfully.")
        except VendorRankingError as exc:
            st.error(str(exc))
        except Exception as exc:  # noqa: BLE001
            st.error(f"Ranking failed: {exc}")

ranked_df = st.session_state.ranked_df
if ranked_df is not None and isinstance(ranked_df, pd.DataFrame):
    st.subheader("Ranked Vendors")
    st.dataframe(ranked_df, use_container_width=True)

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Vendors ranked", len(ranked_df))
    with col2:
        identifier_column = (
            vendor_column
            if vendor_column in ranked_df.columns
            else "vendor_id"
            if "vendor_id" in ranked_df.columns
            else ranked_df.columns[0]
        )
        top_vendor = ranked_df.iloc[0][identifier_column]
        st.metric("Top vendor", str(top_vendor))
    with col3:
        st.metric("Top score", f"{float(ranked_df.iloc[0]['weighted_score']):.3f}")

    ranked_csv = ranked_df.to_csv(index=False).encode("utf-8")
    st.download_button(
        "Download ranked CSV",
        data=ranked_csv,
        file_name="ranked_vendors.csv",
        mime="text/csv",
    )

    if st.button("Generate Short Explanation"):
        try:
            with st.spinner("Generating explanation..."):
                explanation = generate_vendor_ranking_explanation(
                    ranked_df=ranked_df,
                    top_n=top_n,
                    model=model_override or None,
                )
            st.session_state.explanation = explanation
        except VendorExplanationError as exc:
            st.error(str(exc))
        except Exception as exc:  # noqa: BLE001
            st.error(f"Explanation generation failed: {exc}")

    if st.session_state.explanation:
        st.subheader("Business Explanation")
        st.info(st.session_state.explanation)
else:
    st.info("Upload a CSV and click 'Rank Vendors' to view ranked output.")
