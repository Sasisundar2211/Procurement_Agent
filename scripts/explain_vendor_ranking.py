#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path
import sys

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.services.vendor_explanation_service import (
    VendorExplanationError,
    explain_ranked_vendors_from_csv_sync,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate short business explanation from ranked vendor CSV using OpenAI API.",
    )
    parser.add_argument("ranked_csv", help="Path to ranked vendor CSV")
    parser.add_argument("--top-n", type=int, default=3, help="How many top-ranked vendors to summarize")
    parser.add_argument("--model", default=None, help="Optional OpenAI model override")
    return parser.parse_args()


def main() -> int:
    args = parse_args()

    try:
        explanation = explain_ranked_vendors_from_csv_sync(
            csv_path=args.ranked_csv,
            top_n=args.top_n,
            model=args.model,
        )
    except VendorExplanationError as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    print(explanation)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
