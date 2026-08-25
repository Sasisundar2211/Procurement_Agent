# Inference Outputs Directory

This directory stores inference prediction outputs.

Output files are CSV files named with timestamps:
- `predictions_YYYYMMDD_HHMMSS.csv` - Detected price drifts

## Usage

Run inference:
```bash
python inference.py --model-path models/<model_folder> --data-path data/public --output-dir outputs
```
