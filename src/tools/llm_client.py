# src/tools/llm_client.py
from dotenv import load_dotenv
import pathlib
env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

import os
import google.generativeai as genai

# Cached Gemini model instance to avoid re-configuring and re-instantiating on every call
_gemini_model = None

def _get_gemini_model():
    """Returns a cached Gemini model instance, configuring genai only once."""
    global _gemini_model
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    if _gemini_model is None:
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel('gemini-1.5-flash')
    return _gemini_model

def get_llm_provider():
    provider = os.getenv("LLM_PROVIDER", "local")
    return provider

def summarize_drift_with_gemini(contract_price, po_price):
    """
    Uses Gemini to summarize a price drift.
    """
    model = _get_gemini_model()
    if model is None:
        return "Gemini API Key not found. Please set GEMINI_API_KEY in .env."

    try:
        prompt = f"Here is a price mismatch: Contract ${contract_price}, PO ${po_price}. Write a one-sentence summary for the dashboard."
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Fallback for demo purposes if API key is invalid/restricted
        drift_pct = ((po_price - contract_price) / contract_price) * 100
        return f"⚠️ High Drift Detected: PO price is {drift_pct:.1f}% higher than contract. (AI Summary Unavailable)"
