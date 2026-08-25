# Procurement Agent API (FastAPI)

Production-oriented procurement drift detection service built with FastAPI.

## Architecture

The backend now follows a modular structure:

- `src/api/`: FastAPI app, routers, and route handlers
- `src/services/`: business logic (detection, simulation, ingestion, task orchestration)
- `src/models/`: Pydantic API contracts and task store primitives
- `src/utils/`: settings, database engine, logging, serialization helpers

Legacy paths (`src/api/fastapi_app.py`, `src/agents/*`) are kept as compatibility wrappers.

## Quickstart

1. Create a virtual environment and install dependencies:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Generate and ingest demo data:

```bash
python data_generator.py
python -c "from src.agents.ingestor import run; run()"
```

4. Start the API:

```bash
uvicorn src.api.main:app --reload --port 8000
```

5. (Optional) Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

- `GET /api/health`: health/version check
- `GET /api/leaks`: current drift detections
- `POST /api/run-detection`: start async detection task
- `GET /api/run-detection/{task_id}`: poll task status
- `POST /api/simulate-traffic`: append synthetic traffic for demos
- `POST /api/vendors/rank`: upload CSV and return weighted vendor ranking
- `POST /api/vendors/explain-ranking`: upload ranked CSV and get short OpenAI business summary

## Vendor Ranking (CSV -> Ranked Vendors)

Use weighted scoring to rank vendors from a CSV file.

CLI usage:

```bash
python scripts/rank_vendors.py input.csv -o ranked_vendors.csv --weights "unit_price:-0.5,on_time_rate:0.3,quality_score:0.2"
```

Notes:

- `vendor_id` is used by default as the vendor key (`--vendor-column` to change).
- Positive weight means higher metric is better.
- Negative weight means lower metric is better (for example cost/price/risk metrics).

## Vendor Ranking Explanation (OpenAI)

Generate a short, business-focused summary from ranked vendor results:

```bash
python scripts/explain_vendor_ranking.py ranked_vendors.csv --top-n 3
```

Required environment variable:

- `OPENAI_API_KEY`

## Streamlit App

Run an interactive app to upload CSV, rank vendors, and generate a short explanation:

```bash
streamlit run streamlit_app.py
```

In the app:

- Upload vendor metrics CSV
- Set optional weights and vendor column
- View ranked vendors and download ranked output CSV
- Generate a short business-focused explanation with OpenAI

## Docker

```bash
docker build -t procurement-agent .
docker run -p 8000:8000 procurement-agent
```

The API is exposed at `http://localhost:8000`.
