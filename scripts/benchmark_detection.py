import time
import pandas as pd
import src.services.detection_service as ds

def run_benchmark():
    # Store original function
    original_func = ds.summarize_drift_with_gemini

    # Mock Gemini function with simulated 100ms API latency per call
    def mock_summarize(contract_price, po_price):
        time.sleep(0.1)
        return f"Summary for contract ${contract_price} vs PO ${po_price}"

    ds.summarize_drift_with_gemini = mock_summarize

    try:
        # Create test DataFrame with 10 rows
        drifts = pd.DataFrame({
            "contract_unit_price": [100.0 + i for i in range(10)],
            "unit_price": [120.0 + i for i in range(10)],
            "price_drift": [1.2 + i * 0.01 for i in range(10)]
        })

        t0 = time.perf_counter()
        res = ds._build_summary(drifts)
        t1 = time.perf_counter()

        elapsed = t1 - t0
        print(f"Benchmark _build_summary time: {elapsed:.4f} seconds")
        print(f"Summarized count: {res['gemini_summary'].notna().sum()}")
        return elapsed
    finally:
        ds.summarize_drift_with_gemini = original_func

if __name__ == "__main__":
    run_benchmark()
