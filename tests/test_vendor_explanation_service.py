import httpx
import pandas as pd
import pytest

from src.services.vendor_explanation_service import (
    VendorExplanationError,
    generate_vendor_ranking_explanation,
    generate_vendor_ranking_explanation_sync,
)


class _DummyResponse:
    def __init__(self, status_code=200, payload=None):
        self.status_code = status_code
        self._payload = payload or {}

    def raise_for_status(self):
        if self.status_code >= 400:
            raise httpx.HTTPStatusError("API error", request=None, response=self)

    def json(self):
        return self._payload


@pytest.mark.asyncio
async def test_generate_vendor_ranking_explanation_success(monkeypatch):
    ranked = pd.DataFrame(
        [
            {"vendor_id": "V001", "rank": 1, "weighted_score": 0.81},
            {"vendor_id": "V002", "rank": 2, "weighted_score": 0.58},
        ]
    )

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    captured = {}

    async def fake_post(self, url, headers=None, json=None, timeout=None):
        captured["url"] = str(url)
        captured["headers"] = headers
        captured["json"] = json
        captured["timeout"] = timeout
        return _DummyResponse(
            payload={"choices": [{"message": {"content": "V001 leads clearly; maintain partnership and monitor trailing vendors."}}]}
        )

    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    text = await generate_vendor_ranking_explanation(ranked)

    assert "V001" in text
    assert captured["url"].endswith("/chat/completions")
    assert captured["headers"]["Authorization"] == "Bearer test-key"
    assert captured["json"]["model"]


def test_generate_vendor_ranking_explanation_sync_success(monkeypatch):
    ranked = pd.DataFrame(
        [
            {"vendor_id": "V001", "rank": 1, "weighted_score": 0.81},
            {"vendor_id": "V002", "rank": 2, "weighted_score": 0.58},
        ]
    )

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    async def fake_post(self, url, headers=None, json=None, timeout=None):
        return _DummyResponse(
            payload={"choices": [{"message": {"content": "V001 leads clearly; maintain partnership and monitor trailing vendors."}}]}
        )

    monkeypatch.setattr("httpx.AsyncClient.post", fake_post)

    text = generate_vendor_ranking_explanation_sync(ranked)
    assert "V001" in text


@pytest.mark.asyncio
async def test_generate_vendor_ranking_explanation_requires_api_key(monkeypatch):
    ranked = pd.DataFrame([
        {"vendor_id": "V001", "rank": 1, "weighted_score": 0.81},
    ])
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)

    with pytest.raises(VendorExplanationError):
        await generate_vendor_ranking_explanation(ranked)


@pytest.mark.asyncio
async def test_generate_vendor_ranking_explanation_validates_columns(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    ranked = pd.DataFrame([
        {"vendor_id": "V001", "weighted_score": 0.81},
    ])

    with pytest.raises(VendorExplanationError):
        await generate_vendor_ranking_explanation(ranked)
