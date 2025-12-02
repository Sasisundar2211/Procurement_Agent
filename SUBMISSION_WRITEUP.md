# Kaggle Competition Submission Write-up

## Title

Procurement Price-Drift Enforcement Agent

## Subtitle

Automated detection of price discrepancies in procurement contracts using Python and Pandas.

## Card and Thumbnail Image

_(Please use the generated image `procurement_agent_thumbnail.png` found in the artifacts)_

## Submission Track

Agents

## Project Description

### Problem Statement

In large organizations, procurement processes are often plagued by "price drift"—a phenomenon where the actual price paid on a Purchase Order (PO) exceeds the negotiated contract rate. This occurs due to manual entry errors, outdated system data, or lack of real-time oversight. These small discrepancies, when compounded over thousands of transactions, result in significant financial leakage and compliance risks. Solving this is critical for maintaining financial discipline and ensuring that negotiated savings are actually realized.

### Why agents?

Traditional rule-based systems are often rigid and siloed. An agentic approach is superior because it can act autonomously to bridge the gap between static data (contracts) and dynamic transactions (POs). Agents can:

1.  **Orchestrate complex workflows**: Seamlessly moving from data ingestion to analysis and reporting without human intervention.
2.  **Adapt and Scale**: Future iterations can use LLMs to "read" complex PDF contracts just like a human agent would, something standard scripts cannot do easily.
3.  **Proactive Enforcement**: Instead of just reporting errors at the end of the month, an agent can sit in the loop, flagging or blocking POs in real-time.

### What you created

I built the **Procurement Price-Drift Enforcement Agent**, a modular system designed to detect and flag non-compliant transactions.

**Architecture:**

- **Ingestion Agent**: A dedicated module that ingests real-world public procurement data (e.g., San Francisco City data) and normalizes it into a structured SQL database.
- **Detection Engine**: A logic core that joins Purchase Orders with Contracts and calculates the `price_drift` ratio. It automatically flags any transaction where `unit_price > contract_price`.
- **API Layer**: A high-performance FastAPI backend that exposes these capabilities to external systems.
- **Interactive Dashboard**: A modern React + Tailwind CSS frontend that provides:
  - **Real-time Monitoring**: Visualizing drift stats and active alerts.
  - **Interactive Demo**: A built-in guide to help users understand the system.
  - **Leak Generator**: A simulation tool that injects artificial price leaks into the data to demonstrate the agent's detection capabilities.

### Demo

The system runs as a local web application.

1.  **Dashboard**: The main interface shows a live feed of procurement transactions.
2.  **Detection**: Users can click "Run Detection" to scan thousands of records against contracts.
3.  **Simulation**: The "Generate Leaks" feature creates synthetic non-compliant transactions, which the agent immediately detects and flags with "High Drift" alerts.

_(Insert a link to your YouTube video or a GIF here)_

### The Build

The solution was built using a modern, scalable stack:

- **Python 3.10+**: The core language for agent logic.
- **Pandas**: Used for high-performance data manipulation and vectorised comparison of thousands of records.
- **FastAPI**: Chosen for building a high-performance, asynchronous REST API.
- **React & Tailwind CSS**: For a responsive, professional-grade user interface.
- **SQLite & SQLAlchemy**: For lightweight, serverless data persistence.
- **KaggleHub**: To fetch real-world datasets (San Francisco Procurement Data) for realistic testing.

### If I had more time, this is what I'd do

- **LLM Integration**: I would integrate a multimodal LLM to directly parse scanned PDF contracts, extracting pricing terms automatically.
- **Automated Negotiation**: The agent could be empowered to draft emails to vendors inquiring about the price discrepancy.
- **Predictive Analytics**: Use ML to predict which vendors are most likely to drift in the future based on historical patterns.

## Attachments

- **Code Repository**: [Link to your GitHub Repository or Kaggle Notebook]
  - _Note: Ensure you push the `submission` folder content or the full repo (excluding `data/private`) to a public repository._

## Media Gallery

- _(Optional: Add a link to a YouTube video demonstrating the API running and detecting a drift)_

---

## Kaggle Winner Reproducibility Requirements

This section documents all requirements for Kaggle competition compliance and winner's obligations.

### License Declaration

This submission is licensed under **Creative Commons Attribution-ShareAlike 4.0 International (CC-BY-SA 4.0)** in accordance with the Competition rules. See the [LICENSE](LICENSE) file for the complete license text.

### Architecture Description

**Model Type**: Rule-based price drift detection with optional LLM summarization

**Components**:
1. **Data Ingestion Layer** (`ingest_sf_data.py`, `data_generator.py`)
   - Ingests procurement data from CSV files
   - Normalizes data into SQLite database
   - Generates synthetic training data with configurable leak probability

2. **Detection Engine** (`src/agents/price_detector.py`)
   - Joins Purchase Orders with Contracts on `contract_id`
   - Calculates `price_drift = unit_price / contract_unit_price`
   - Flags transactions where drift exceeds threshold (default: 1.05 = 5%)

3. **API Layer** (`src/api/fastapi_app.py`)
   - FastAPI backend exposing detection endpoints
   - Serves React frontend static files

4. **Frontend** (`frontend/`)
   - React + Tailwind CSS dashboard
   - Real-time drift visualization

**Pretrained Models**: None required. Optional Google Gemini API integration for generating human-readable drift summaries.

### Preprocessing Steps

1. **Data Cleaning**:
   ```python
   # Remove rows with missing quantities or amounts
   df = df.dropna(subset=['Encumbered Quantity', 'Encumbered Amount'])
   df = df[df['Encumbered Quantity'] > 0]
   df = df[df['Encumbered Amount'] > 0]
   ```

2. **Feature Engineering**:
   ```python
   # Calculate unit price from total and quantity
   df['unit_price'] = df['Encumbered Amount'] / df['Encumbered Quantity']
   # Filter unreasonable prices
   df = df[df['unit_price'] > 0.01]
   ```

3. **Data Split Strategy**: Not applicable (rule-based system). For ML extensions, recommend 80/10/10 train/validation/test split with stratification by drift label.

### Loss Function and Evaluation Metrics

**Loss Function**: Not applicable (rule-based detection)

**Evaluation Metrics**:
- Precision: True positive drifts / All flagged drifts
- Recall: True positive drifts / All actual drifts
- F1 Score: Harmonic mean of precision and recall
- Drift Threshold: Default 5% above contract price (configurable)

### Training Details

**Training Loop**: Rule-based system requires no iterative training. Configuration involves:
1. Setting drift threshold parameter
2. Validating contract-PO join logic
3. Testing on synthetic data with known leaks

**Parameters**:
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| `drift_threshold` | 1.05 (5%) | Ratio above which price drift is flagged |
| `batch_size` | 32 | For future ML extensions |
| `learning_rate` | 0.001 | For future ML extensions |
| `epochs` | 10 | For future ML extensions |
| `seed` | 42 | Random seed for reproducibility |

**Hardware Used**:
- CPU: Any modern CPU (tested on Intel/AMD)
- RAM: 4 GB minimum, 8 GB recommended
- GPU: Not required
- TODO: Update with actual hardware specs used for final training

**Runtime**:
- Data ingestion: ~1-2 minutes for 5000 POs
- Detection: ~30 seconds per 10,000 records
- TODO: Update with actual runtime measurements

### Commands to Reproduce

**Docker Commands**:
```bash
# Build
docker build -t procurement-agent .

# Train
docker run --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/models:/app/models \
  procurement-agent \
  python train.py --data-path /app/data/public --output-dir /app/models --seed 42

# Inference
docker run --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/models:/app/models \
  -v $(pwd)/outputs:/app/outputs \
  procurement-agent \
  python inference.py --model-path /app/models/<model_folder> --data-path /app/data/public
```

**Local Commands**:
```bash
# Setup
pip install -r requirements.txt
python data_generator.py

# Train
python train.py --data-path data/public --output-dir models --epochs 10 --seed 42

# Inference
python inference.py --model-path models/<model_folder> --data-path data/public --print-samples
```

### Code Locations

| Component | Path |
|-----------|------|
| Training entrypoint | `train.py` |
| Inference entrypoint | `inference.py` |
| Core detection logic | `src/agents/price_detector.py` |
| Data ingestion | `ingest_sf_data.py`, `data_generator.py` |
| API server | `src/api/fastapi_app.py` |
| Frontend | `frontend/` |

### Expected Runtime and Compute Cost

| Task | Runtime | Compute Cost |
|------|---------|--------------|
| Data generation | ~1 minute | Negligible |
| Data ingestion | ~2 minutes | Negligible |
| Training/Configuration | ~1-5 minutes | TODO: Measure actual |
| Inference (10K records) | ~30 seconds | Negligible |

**Approximate Total**: ~X hours on standard CPU (TODO: Update with actual measurements)

### External Data and Pretrained Models

See [EXTERNAL_DATA.md](EXTERNAL_DATA.md) for complete documentation of:
- San Francisco Procurement Data (CC0 license)
- Optional Google Gemini API integration

### Additional Documentation

- [MODEL_REPRODUCIBILITY.md](MODEL_REPRODUCIBILITY.md) - Step-by-step reproduction guide
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) - Dependency licenses
- [submission_checklist.md](submission_checklist.md) - Competition compliance checklist
