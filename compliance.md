Compliance notes:

- No hand-labeling or human prediction of competition validation/test sets.
- All synthetic labels are kept in a separate file data/labels_private.csv and must NOT be included in any submission artifact.
- Code will not be privately shared with other teams during competition period.
- All code is licensed under CC-BY-SA 4.0 and published to the competition forum if publicly released during the competition.
- Eligibility: confirm team members meet competition residency and export control rules.

## Kaggle Winner Reproducibility Compliance

### License
This repository is licensed under **CC-BY-SA 4.0** (Creative Commons Attribution-ShareAlike 4.0 International). See the [LICENSE](LICENSE) file for complete terms.

### Required Artifacts Checklist

| Artifact | Status | Location |
|----------|--------|----------|
| Source code | ✅ Provided | Root directory and `src/` |
| Training code | ✅ Provided | `train.py` |
| Inference code | ✅ Provided | `inference.py` |
| Documentation | ✅ Provided | `SUBMISSION_WRITEUP.md`, `MODEL_REPRODUCIBILITY.md` |
| External data disclosure | ✅ Provided | `EXTERNAL_DATA.md` |
| Third-party licenses | ✅ Provided | `THIRD_PARTY_NOTICES.md` |

### Reproducibility Details

**Architecture**: Rule-based price drift detection engine with:
- Data ingestion layer (CSV → SQLite)
- Detection engine (contract-PO price comparison)
- Configurable drift threshold (default: 5%)
- Optional LLM summarization (Google Gemini)

**Preprocessing**:
1. Load CSV data with pandas
2. Clean missing values (dropna on required columns)
3. Calculate unit_price = total / quantity
4. Filter invalid prices (< $0.01)

**Training Parameters**:
- Drift threshold: 1.05 (5% above contract price)
- Random seed: 42
- See `train.py --help` for all parameters

**Evaluation Metrics**:
- Precision, Recall, F1 Score for drift detection
- Measured against synthetic labeled data

**Commands**:
```bash
# Quick start
python data_generator.py
python train.py --dry-run
python inference.py --model-path models/<folder> --data-path data/public
```

**Hardware**:
- CPU: Any modern processor
- RAM: 4 GB minimum
- GPU: Not required
- Runtime: TODO - update with actual measurements

### External Data Sources
See `EXTERNAL_DATA.md` for complete list. Primary sources:
- San Francisco Procurement Data (CC0 - Public Domain)
- Synthetic generated data (CC-BY-SA 4.0)

### No Private Test Data
This repository does NOT contain any private competition test data. The `data/private/` directory contains only synthetic labels for local testing.
