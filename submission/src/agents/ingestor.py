"""Backward-compatible ingestion wrapper.

The production implementation now lives in `src.services.ingestion_service`.
"""

from src.services.ingestion_service import IngestionError, ingest_public_data


def run() -> None:
    print("Ingesting data...")
    try:
        ingest_public_data()
        print("Data ingestion complete.")
    except IngestionError as exc:
        print(f"Error: {exc}. Generate data first or place CSV files under data/public.")


if __name__ == "__main__":
    run()
