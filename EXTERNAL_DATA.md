# External Data Sources

This document lists all external data sources used by the Procurement Price-Drift Detection Agent, including their licenses and access instructions.

## Data Sources

### 1. San Francisco Procurement Data

| Property | Value |
|----------|-------|
| **Name** | San Francisco Procurement Data |
| **URL** | https://www.kaggle.com/datasets/vineethakkinapalli/san-francisco-procurement-data |
| **Description** | Public procurement data from the City and County of San Francisco, including purchase orders, contracts, and vendor information |
| **License** | CC0: Public Domain (as per Kaggle dataset) |
| **Access** | Freely accessible via Kaggle (requires free Kaggle account) |
| **Size** | ~900 MB (CSV format) |

**Download Instructions:**

```bash
# Option 1: Using the provided download script (requires kagglehub)
pip install kagglehub
python download_sf_data.py

# Option 2: Manual download
# 1. Visit https://www.kaggle.com/datasets/vineethakkinapalli/san-francisco-procurement-data
# 2. Download the dataset
# 3. Extract to data/sf_data/sf_procurement.csv

# Option 3: Using Kaggle CLI
kaggle datasets download -d vineethakkinapalli/san-francisco-procurement-data
unzip san-francisco-procurement-data.zip -d data/sf_data/
```

**Data Placement:**
```
data/
└── sf_data/
    └── sf_procurement.csv
```

### 2. Synthetic Data (Generated)

| Property | Value |
|----------|-------|
| **Name** | Synthetic Procurement Data |
| **Description** | Programmatically generated synthetic data for testing and demonstration |
| **License** | Same as this repository (CC-BY-SA 4.0) |
| **Access** | Generated locally by running `data_generator.py` |

**Generation Instructions:**

```bash
python data_generator.py
```

**Output Files:**
```
data/
├── public/
│   ├── contracts.csv    # Public contracts data
│   └── pos.csv          # Public purchase orders
└── private/
    ├── contracts_full.csv
    ├── pos_full.csv
    └── pos_labels.csv   # Labels (NOT for submission)
```

## Pretrained Models

### Google Gemini API (Optional)

| Property | Value |
|----------|-------|
| **Name** | Google Gemini |
| **URL** | https://ai.google.dev/ |
| **Description** | Large language model used for generating human-readable drift summaries |
| **License** | Google Gemini API Terms of Service |
| **Access** | Requires Google API key (free tier available) |

**Setup Instructions:**

```bash
# Set your API key as environment variable
export GEMINI_API_KEY="your_api_key_here"

# Or copy .env.example to .env and add your key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key
```

**Important Notes:**
- The Gemini API is optional and used only for generating drift summaries
- The core detection logic works without any LLM
- If no API key is set, the system falls back to template-based summaries

## License Compatibility

| Data Source | License | Compatible with CC-BY-SA 4.0? |
|-------------|---------|------------------------------|
| San Francisco Procurement Data | CC0 (Public Domain) | ✅ Yes |
| Synthetic Data | CC-BY-SA 4.0 | ✅ Yes |
| Google Gemini Outputs | See Terms of Service | ⚠️ Review required for redistribution |

## Data Privacy and Compliance Notes

1. **No Private Competition Data**: This repository does not contain any private competition test data.

2. **No PII**: The San Francisco procurement data is public government data and does not contain personally identifiable information (PII) of individuals.

3. **Synthetic Labels**: Any synthetic labels (in `data/private/pos_labels.csv`) are NOT included in submission artifacts and are used only for local testing.

## Updating Data

To refresh the San Francisco procurement data:

```bash
# Remove old data
rm -rf data/sf_data/

# Re-download
python download_sf_data.py

# Re-ingest
python ingest_sf_data.py
```

## Questions

If you have questions about data sources or licensing, please open an issue on the repository.
