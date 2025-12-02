# Model Artifacts Directory

This directory stores trained model artifacts.

Each model is saved in a timestamped subdirectory containing:
- `config.json` - Model configuration (drift threshold, model type)
- `metadata.json` - Training metadata (hyperparameters, git commit)
- `metrics.json` - Training metrics

## Usage

Train a model:
```bash
python train.py --output-dir models --seed 42
```

Use a trained model for inference:
```bash
python inference.py --model-path models/<model_folder> --data-path data/public
```
