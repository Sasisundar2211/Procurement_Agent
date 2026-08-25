from __future__ import annotations

import asyncio
import os
import time
import httpx
import pandas as pd

os.environ["OPENAI_API_KEY"] = "test-key"

df = pd.DataFrame([
    {"vendor_id": "V001", "rank": 1, "weighted_score": 0.81},
    {"vendor_id": "V002", "rank": 2, "weighted_score": 0.58},
])


class MockResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {}

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("API error", request=None, response=self)

    def json(self):
        return self._payload


def benchmark_sync():
    """Simulates 10 sequential blocking requests with 0.1s network latency."""
    start = time.perf_counter()
    for _ in range(10):
        time.sleep(0.1)
    elapsed = time.perf_counter() - start
    print(f"Sync baseline (10 requests): {elapsed:.4f}s")
    return elapsed


async def benchmark_async():
    """Simulates 10 concurrent requests using generate_vendor_ranking_explanation and httpx.AsyncClient with 0.1s network latency."""
    from src.services.vendor_explanation_service import generate_vendor_ranking_explanation

    async def fake_post(self, url, headers=None, json=None, timeout=None):
        await asyncio.sleep(0.1)
        return MockResponse(
            payload={"choices": [{"message": {"content": "V001 leads clearly; monitor trailing vendors."}}]}
        )

    original_post = httpx.AsyncClient.post
    httpx.AsyncClient.post = fake_post

    try:
        start = time.perf_counter()
        async with httpx.AsyncClient() as client:
            tasks = [generate_vendor_ranking_explanation(df, client=client) for _ in range(10)]
            results = await asyncio.gather(*tasks)
        elapsed = time.perf_counter() - start
        print(f"Async implementation (10 concurrent requests): {elapsed:.4f}s")
        assert len(results) == 10
        return elapsed
    finally:
        httpx.AsyncClient.post = original_post


def main():
    sync_time = benchmark_sync()
    async_time = asyncio.run(benchmark_async())
    speedup = sync_time / async_time if async_time > 0 else 0
    print(f"Speedup: {speedup:.2f}x faster ({((sync_time - async_time) / sync_time) * 100:.1f}% reduction in latency)")


if __name__ == "__main__":
    main()
