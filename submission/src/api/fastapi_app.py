# src/api/fastapi_app.py
import pandas as pd
from fastapi import FastAPI, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from src.agents.price_detector import detect_public_only
import os
import uuid

app = FastAPI()

# In-memory store for task statuses
tasks = {}

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

def run_detection_task(task_id: str):
    """Simulates a long-running detection task."""
    try:
        drifts = detect_public_only()
        tasks[task_id] = {"status": "completed", "result": drifts.to_dict(orient="records")}
    except FileNotFoundError as e:
        tasks[task_id] = {"status": "failed", "error": f"Data file not found: {e}"}
    except pd.errors.EmptyDataError as e:
        tasks[task_id] = {"status": "failed", "error": f"Data file is empty: {e}"}
    except Exception as e:
        tasks[task_id] = {"status": "failed", "error": f"An unexpected error occurred: {e}"}

@app.get("/")
async def read_index():
    return FileResponse(os.path.join(static_dir, 'index.html'))

@app.get("/leaks.html")
async def read_leaks():
    return FileResponse(os.path.join(static_dir, 'leaks.html'))

@app.post("/api/run-detection")
async def run_detection_api(background_tasks: BackgroundTasks):
    task_id = str(uuid.uuid4())
    tasks[task_id] = {"status": "in_progress"}
    background_tasks.add_task(run_detection_task, task_id)
    return {"task_id": task_id, "status": "in_progress"}

@app.get("/api/run-detection/{task_id}")
async def get_task_status(task_id: str):
    return tasks.get(task_id, {"status": "not_found"})

@app.get("/api/leaks")
async def get_leaks_api(drift_threshold: float | None = None):
    leaks = detect_public_only(drift_threshold=drift_threshold)
    return leaks.to_dict(orient="records")

# Import data generator functions
from data_generator import gen_items, gen_vendors, gen_contracts, gen_pos
from src.agents.price_detector import engine
import random

@app.post("/api/simulate-traffic")
async def simulate_traffic(background_tasks: BackgroundTasks):
    """Generates new random POs and appends them to the database to simulate live traffic."""
    def _generate_and_insert():
        # Generate small batch of new data
        items = gen_items(n=50)
        vendors = gen_vendors(n=10)
        # We need existing contracts to link to, but for simplicity we'll generate a few new ones too
        # or just fetch existing ones. fetching is better but let's just generate a small consistent set
        # actually, to ensure we match existing contracts in DB, we should read them.
        # But for speed, let's just generate new contracts and POs.
        
        contracts_df = pd.read_sql("select * from contracts", engine)
        
        # Generate 50 new POs with a very high leak probability (50%) to ensure leaks appear in demo
        new_pos_df, _ = gen_pos(vendors, items, contracts_df, n_pos=50, leak_prob=0.5)
        
        # Append to DB
        new_pos_df.to_sql("pos", engine, if_exists="append", index=False)
        print(f"Simulated 50 new POs.")

    background_tasks.add_task(_generate_and_insert)
    return {"status": "simulation_started", "message": "Generating 50 new transactions..."}