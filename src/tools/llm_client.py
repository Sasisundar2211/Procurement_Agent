# src/tools/llm_client.py
import os
def get_llm_provider():
    provider = os.getenv("LLM_PROVIDER", "local")
    return provider

def draft_message(prompt):
    provider = get_llm_provider()
    if provider == "openai":
        # placeholder - requires LLM_API_KEY in env; DO NOT COMMIT
        import openai
        openai.api_key = os.getenv("LLM_API_KEY")
        resp = openai.ChatCompletion.create(model="gpt-4o-mini", messages=[{"role":"user","content":prompt}], max_tokens=300)
        return resp.choices[0].message.content
    else:
        # local fallback: simple template-based deterministic draft (no network)
        return "DRAFT: " + prompt[:400]