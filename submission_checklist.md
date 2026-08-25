# Kaggle Competition Submission Checklist

This checklist ensures compliance with Kaggle competition rules for the Procurement Price-Drift Detection Agent submission.

## License Requirements

| Requirement | Status | Notes |
|------------|--------|-------|
| Winner license declared (CC-BY-SA 4.0) | ✅ PASS | LICENSE file contains full CC-BY-SA 4.0 text |
| License referenced in README | ✅ PASS | README.md references the license |
| License referenced in SUBMISSION_WRITEUP | ✅ PASS | SUBMISSION_WRITEUP.md references the license |

## Source Code Requirements

| Requirement | Status | Notes |
|------------|--------|-------|
| All source code included | ✅ PASS | Full source in `src/`, scripts at root |
| Training code provided | ✅ PASS | `train.py` with CLI interface |
| Inference code provided | ✅ PASS | `inference.py` with CLI interface |
| Dependencies documented | ✅ PASS | `requirements.txt` with pinned versions |
| Docker support | ✅ PASS | `Dockerfile` provided |

## Documentation Requirements

| Requirement | Status | Notes |
|------------|--------|-------|
| Architecture description | ✅ PASS | In SUBMISSION_WRITEUP.md |
| Preprocessing steps documented | ✅ PASS | In SUBMISSION_WRITEUP.md and MODEL_REPRODUCIBILITY.md |
| Training commands documented | ✅ PASS | In MODEL_REPRODUCIBILITY.md |
| Inference commands documented | ✅ PASS | In MODEL_REPRODUCIBILITY.md |
| Hardware requirements documented | ✅ PASS | In MODEL_REPRODUCIBILITY.md |
| Runtime estimates | ⚠️ AUTHOR INPUT NEEDED | Measure actual runtime and update MODEL_REPRODUCIBILITY.md |
| Random seeds documented | ✅ PASS | Default seed=42 in train.py |

## Hyperparameters and Reproducibility

| Requirement | Status | Notes |
|------------|--------|-------|
| Hyperparameters documented | ✅ PASS | In train.py CLI and saved to metadata.json |
| Drift threshold documented | ✅ PASS | Default 1.05 (5% above contract price) |
| Batch size | ✅ PASS | Default 32, configurable via CLI |
| Learning rate | ✅ PASS | Default 0.001, configurable via CLI |
| Number of epochs | ✅ PASS | Default 10, configurable via CLI |
| Random seed | ✅ PASS | Default 42, configurable via CLI |
| Exact compute hours | ⚠️ AUTHOR INPUT NEEDED | Run full training and document actual time |

## External Data and Models

| Requirement | Status | Notes |
|------------|--------|-------|
| External data sources listed | ✅ PASS | EXTERNAL_DATA.md created |
| Data licenses documented | ✅ PASS | CC0 for SF data |
| Download instructions provided | ✅ PASS | In EXTERNAL_DATA.md |
| Pretrained models listed | ✅ PASS | Gemini API (optional) documented |
| Model licenses documented | ✅ PASS | In EXTERNAL_DATA.md |

## Third-Party Dependencies

| Requirement | Status | Notes |
|------------|--------|-------|
| All dependencies listed | ✅ PASS | requirements.txt |
| Dependency licenses documented | ✅ PASS | THIRD_PARTY_NOTICES.md |
| CC-BY-SA 4.0 compatibility noted | ✅ PASS | In THIRD_PARTY_NOTICES.md |

## Private/Restricted Data Check

| Requirement | Status | Notes |
|------------|--------|-------|
| No private test data in repo | ✅ PASS | No competition test data found |
| Private labels excluded from submission | ✅ PASS | data/private/ in .gitignore |
| No secrets in repository | ✅ PASS | .env.example provided, actual .env in .gitignore |

## Files Requiring Author Review

The following items need author input before final submission:

### 1. Exact Runtime and Compute Hours
- **Location**: MODEL_REPRODUCIBILITY.md, SUBMISSION_WRITEUP.md
- **Action Required**: Run full training and record actual time
- **Template**: `TODO: Update with actual runtime measurements`

### 2. Team Information
- **Location**: submission_compliance.txt
- **Action Required**: Add team names and Kaggle handles
- **Template**: `Team: <Names and Kaggle handles>`

### 3. Repository Link
- **Location**: SUBMISSION_WRITEUP.md, submission_compliance.txt
- **Action Required**: Add public repository link
- **Template**: `[Link to your GitHub Repository or Kaggle Notebook]`

### 4. Demo Video Link
- **Location**: SUBMISSION_WRITEUP.md
- **Action Required**: Add YouTube video or GIF link
- **Template**: `_(Insert a link to your YouTube video or a GIF here)_`

## Potential Issues Detected

### Files to Review

| File/Pattern | Status | Recommendation |
|-------------|--------|----------------|
| `data/private/` | ⚠️ REVIEW | Ensure this directory is not included in any submission artifact |
| `data/sf_data/sf_procurement.csv` | ⚠️ REVIEW | Large file (904MB) - consider adding to .gitignore and excluding from git history |
| `.env` | ✅ OK | Already in .gitignore |

### Large Files Check

Run this command to check for large files that shouldn't be committed:

```bash
find . -type f -size +10M -not -path "./.git/*" -not -path "./node_modules/*"
```

## Final Submission Checklist

Before submitting to Kaggle:

- [ ] Fill in all TODO items marked above
- [ ] Verify training runs successfully with documented commands
- [ ] Verify inference produces expected output
- [ ] Remove any private competition data
- [ ] Test Docker build and run
- [ ] Create submission package per MODEL_REPRODUCIBILITY.md

## Compliance Affirmation

By submitting this entry, the team affirms:

- [ ] No human labeling or test-set leakage was used
- [ ] All code dependencies and licenses are listed
- [ ] No secrets are included in the repository
- [ ] The submission is licensed under CC-BY-SA 4.0

---

*Last updated: Auto-generated by compliance tooling*
*Review required by: Repository owner*
