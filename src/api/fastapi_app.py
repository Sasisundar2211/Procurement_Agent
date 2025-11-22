# src/api/fastapi_app.py
from fastapi import FastAPI
from src.agents.price_detector import detect_public_only

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Procurement Price-Drift Enforcement Agent API"}

@app.post("/run_detection")
def run_detection():
    print("Running detection...")
    results = detect_public_only()
    print("Detection complete.")
    return {"message": "Detection process finished.", "results_summary": f"{len(results)} records processed."}