# Project Report — Autonomous Procurement AI System

## Overview
The Autonomous Procurement AI System detects contract price drift, ranks vendors based on weighted performance metrics, and generates AI explanations for procurement anomalies and rankings.

## System Architecture & Deployment Split

### 1. Frontend (Vite + React + Tailwind CSS)
- **Hosted on:** Vercel
- **Root Directory:** `frontend/`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Configuration:** Managed via `frontend/vercel.json` (SPA routing rewind to `/index.html`).
- **Environment Variable:** Set `VITE_API_URL` to point to the backend API endpoint.

### 2. Backend (FastAPI + Async Tasks + Agent Pipeline)
- **Hosted on:** Render / Railway (or Docker container environment)
- **Dockerfile Source:** `Dockerfile.fastapi`
- **Start Command:** `uvicorn src.api.main:app --host 0.0.0.0 --port $PORT`
- **Health Check Endpoint:** `GET /api/health`

## Directory Structure & Hygiene
- `frontend/`: React single-page frontend application
- `src/`: Modular FastAPI backend (routers, services, models, utils, tools)
- `scripts/`: Data ingestion, ranking, and dev utilities
  - `scripts/data/`: Data generation and ingestion scripts (`data_generator.py`, `ingest_sf_data.py`, `download_sf_data.py`, `cols.txt`)
  - `scripts/dev/`: Developer tools (`check_port.py`)
- `docs/internal/`: Internal architecture notes, compliance docs, prompt libraries, and submission writeups
- `archive/streamlit_prototype/`: Prototype Streamlit interface archived for reference

## Key API Endpoints
- `GET /api/health` — API health check
- `GET /api/leaks` — Retrieve flagged pricing drift anomalies
- `POST /api/run-detection` — Asynchronous drift detection pipeline execution
- `GET /api/run-detection/{task_id}` — Poll task status
- `POST /api/simulate-traffic` — Generate synthetic purchase order traffic
- `POST /api/vendors/rank` — Rank vendors based on customizable metric weights
- `POST /api/vendors/explain-ranking` — Generate AI business summaries of vendor rankings

## Local Quickstart
1. **Backend:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn src.api.main:app --reload --port 8000
   ```
2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
