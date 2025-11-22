# src/api/fastapi_app.py
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.agents.price_detector import detect_public_only
import os

app = FastAPI()

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(static_dir, 'index.html'))

@app.post("/run_detection")
def run_detection():
    drifts = detect_public_only()
    return drifts.to_dict(orient="records")