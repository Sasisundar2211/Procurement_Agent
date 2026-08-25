# Model Reproducibility Guide

This document provides step-by-step instructions to reproduce the Procurement Price-Drift Detection model from a clean checkout.

## Prerequisites

- Docker (recommended) or Python 3.10+
- Git
- At least 4GB RAM
- Internet connection (for downloading dependencies and data)

## Quick Start with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/Sasisundar2211/Procurement_Agent.git
cd Procurement_Agent
```

### 2. Build the Docker Image

```bash
docker build -t procurement-agent .
```

### 3. Run Training

```bash
# Create directories for model outputs
mkdir -p models outputs

# Run training with Docker
docker run --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/models:/app/models \
  procurement-agent \
  python train.py --data-path /app/data/public --output-dir /app/models --epochs 10 --seed 42
```

### 4. Run Inference

```bash
docker run --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/models:/app/models \
  -v $(pwd)/outputs:/app/outputs \
  procurement-agent \
  python inference.py --model-path /app/models/<model_folder> --data-path /app/data/public --print-samples
```

## Local Setup (Without Docker)

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies (Optional, for UI)

```bash
cd frontend
npm install
cd ..
```

### 4. Generate Training Data

```bash
# Generate synthetic data for training
python data_generator.py

# Or download real San Francisco procurement data
python download_sf_data.py
python ingest_sf_data.py
```

### 5. Run Training

```bash
python train.py \
  --data-path data/public \
  --output-dir models \
  --epochs 10 \
  --batch-size 32 \
  --learning-rate 0.001 \
  --seed 42
```

### 6. Run Inference

```bash
python inference.py \
  --model-path models/<model_folder> \
  --data-path data/public \
  --output-dir outputs \
  --print-samples
```

## Expected Output Locations

| Artifact | Location | Description |
|----------|----------|-------------|
| Model artifacts | `models/<timestamp>/` | Contains config.json, metadata.json, metrics.json |
| Predictions | `outputs/predictions_<timestamp>.csv` | CSV file with detected price drifts |
| Training logs | Console output | Training progress and metrics |

## Reproducing Exact Results

To reproduce exact results:

1. **Use the same random seed**: `--seed 42`
2. **Use the same data**: Ensure you're using the same version of the dataset
3. **Use the same environment**: Use Docker or the exact package versions in `requirements.txt`
4. **Use the same hyperparameters**: See the metadata.json in any saved model for exact parameters used

## Model Artifacts Structure

```
models/
└── procurement_model_YYYYMMDD_HHMMSS/
    ├── config.json       # Model configuration (drift threshold, model type)
    ├── metadata.json     # Training metadata (hyperparameters, git commit)
    └── metrics.json      # Training metrics
```

## Packaging for Delivery to Sponsor

To package model artifacts for delivery:

```bash
# Create a submission package
tar -czvf submission_package.tar.gz \
  models/<model_folder>/ \
  outputs/ \
  train.py \
  inference.py \
  requirements.txt \
  MODEL_REPRODUCIBILITY.md
```

## Compute Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 4 GB | 8 GB |
| Storage | 2 GB | 5 GB |
| GPU | Not required | Not required |
| CPU | 2 cores | 4 cores |

**Expected Runtime**:
- Data generation: ~1 minute
- Training: ~1-5 minutes (TODO: Update with actual runtime)
- Inference: ~30 seconds per 10,000 records

## Troubleshooting

### Common Issues

1. **"Module not found" errors**: Ensure you've installed all requirements:
   ```bash
   pip install -r requirements.txt
   ```

2. **Data not found**: Generate or download data first:
   ```bash
   python data_generator.py
   ```

3. **Permission denied (Docker)**: Ensure directories exist and are writable:
   ```bash
   mkdir -p models outputs data
   chmod 755 models outputs data
   ```

### Getting Help

If you encounter issues reproducing results, please:
1. Check that you're using the exact package versions in requirements.txt
2. Verify the random seed is set correctly
3. Open an issue on the repository with your environment details

## Additional Resources

- [SUBMISSION_WRITEUP.md](SUBMISSION_WRITEUP.md) - Detailed submission documentation
- [EXTERNAL_DATA.md](EXTERNAL_DATA.md) - External data sources and licenses
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) - Third-party dependencies and licenses
