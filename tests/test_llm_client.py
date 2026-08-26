import os
from src.tools.llm_client import get_llm_provider, summarize_drift_with_gemini

def test_get_llm_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "gemini")
    assert get_llm_provider() == "gemini"

def test_summarize_drift_with_gemini_no_api_key(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    result = summarize_drift_with_gemini(100, 120)
    assert "Gemini API Key not found" in result
