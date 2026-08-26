# src/tools/llm_client.py
from dotenv import load_dotenv
import pathlib
env_path = pathlib.Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

import os
import google.generativeai as genai


def summarize_drift_with_gemini(contract_price, po_price):
    """
    Uses Gemini to summarize a price drift.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Gemini API Key not found. Please set GEMINI_API_KEY in .env."

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Here is a price mismatch: Contract ${contract_price}, PO ${po_price}. Write a one-sentence summary for the dashboard."
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Fallback for demo purposes if API key is invalid/restricted
        drift_pct = ((po_price - contract_price) / contract_price) * 100
        return f"⚠️ High Drift Detected: PO price is {drift_pct:.1f}% higher than contract. (AI Summary Unavailable)"
