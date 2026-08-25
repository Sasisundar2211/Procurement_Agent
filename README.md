# Procurement Agent API (FastAPI) & Frontend

Production-oriented procurement drift detection service built with FastAPI and React.

> **Note:** Design notes, prompt libraries, and submission writeups live in `docs/internal/` for anyone curious about the build process.

## Architecture

The project is structured into a dedicated frontend and backend split:

- `frontend/`: Vite + React UI (configured for Vercel deployment)
- `src/api/`: FastAPI app, routers, and route handlers
- `src/services/`: Business logic (detection, simulation, ingestion, task orchestration, vendor ranking)
- `src/models/`: Pydantic API contracts and task store primitives
- `src/utils/`: Settings, database engine, logging, serialization helpers
- `scripts/`: Production & development utility scripts (`scripts/data/`, `scripts/dev/`)
- `docs/internal/`: Internal planning, compliance, and prompt documentation

## Quickstart

### 1. Backend Setup

Create a virtual environment and install dependencies:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Configure environment variables:

```bash
cp .env.example .env
```

Generate and ingest demo data:

```bash
python scripts/data/data_generator.py
python -c "from src.agents.ingestor import run; run()"
```

Start the API backend:

```bash
uvicorn src.api.main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/health`: Health/version check
- `GET /api/leaks`: Current drift detections
- `POST /api/run-detection`: Start async detection task
- `GET /api/run-detection/{task_id}`: Poll task status
- `POST /api/simulate-traffic`: Append synthetic traffic for demos
- `POST /api/vendors/rank`: Upload CSV and return weighted vendor ranking
- `POST /api/vendors/explain-ranking`: Upload ranked CSV and get AI business summary

## Vendor Ranking (CSV -> Ranked Vendors)

Use weighted scoring to rank vendors from a CSV file.

CLI usage:

```bash
python scripts/rank_vendors.py input.csv -o ranked_vendors.csv --weights "unit_price:-0.5,on_time_rate:0.3,quality_score:0.2"
```

## Vendor Ranking Explanation (OpenAI/LLM)

Generate a short, business-focused summary from ranked vendor results:

```bash
python scripts/explain_vendor_ranking.py ranked_vendors.csv --top-n 3
```

## Legacy Prototype UI

The legacy Streamlit prototype is archived under `archive/streamlit_prototype/streamlit_app.py`.

## Deployment

- **Frontend (Vercel):** Root directory `frontend`, build command `npm run build`, output directory `dist`. See `frontend/vercel.json`.
- **Backend (Render/Railway):** Uses `Dockerfile.fastapi` or direct uvicorn process execution with `src.api.main:app`.
