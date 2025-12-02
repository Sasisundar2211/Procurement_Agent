#!/usr/bin/env python3
"""
Inference script for Procurement Price-Drift Detection Agent.

This script provides a CLI to load a trained model artifact and run inference
on procurement data to detect price drifts.

Usage:
    python inference.py --model-path models/procurement_model_20231201_120000 --data-path data/public/pos.csv
    python inference.py --model-path models/procurement_model_20231201_120000 --data-path data/public/pos.csv --print-samples
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd


def load_model(model_path: str) -> dict:
    """
    Load model configuration from artifact directory.
    
    Args:
        model_path: Path to model artifact directory
    
    Returns:
        dict: Model configuration
    """
    model_dir = Path(model_path)
    
    if not model_dir.exists():
        raise FileNotFoundError(f"Model directory not found: {model_path}")
    
    config_path = model_dir / "config.json"
    if not config_path.exists():
        # Fall back to default configuration
        print(f"Warning: config.json not found in {model_path}, using defaults")
        return {
            "drift_threshold": 1.05,
            "model_type": "rule_based",
            "version": "1.0.0"
        }
    
    with open(config_path, "r") as f:
        config = json.load(f)
    
    print(f"Loaded model configuration from: {config_path}")
    print(f"  Model type: {config.get('model_type', 'unknown')}")
    print(f"  Drift threshold: {config.get('drift_threshold', 'unknown')}")
    
    return config


def load_data(data_path: str) -> pd.DataFrame:
    """
    Load data for inference.
    
    Args:
        data_path: Path to data file (CSV) or directory
    
    Returns:
        pd.DataFrame: Loaded data
    """
    path = Path(data_path)
    
    if path.is_file() and path.suffix == ".csv":
        print(f"Loading data from: {data_path}")
        df = pd.read_csv(data_path)
        print(f"  Loaded {len(df)} rows")
        return df
    elif path.is_dir():
        # Look for pos.csv in directory
        pos_path = path / "pos.csv"
        if pos_path.exists():
            print(f"Loading data from: {pos_path}")
            df = pd.read_csv(pos_path)
            print(f"  Loaded {len(df)} rows")
            return df
        else:
            raise FileNotFoundError(f"pos.csv not found in {data_path}")
    else:
        raise FileNotFoundError(f"Data file not found: {data_path}")


def load_contracts(data_path: str) -> pd.DataFrame:
    """
    Load contracts reference data.
    
    Args:
        data_path: Path to data file or directory
    
    Returns:
        pd.DataFrame: Contracts data
    """
    path = Path(data_path)
    
    if path.is_file():
        # Assume contracts are in same directory as data file
        contracts_path = path.parent / "contracts.csv"
    else:
        contracts_path = path / "contracts.csv"
    
    if contracts_path.exists():
        print(f"Loading contracts from: {contracts_path}")
        df = pd.read_csv(contracts_path)
        print(f"  Loaded {len(df)} contracts")
        return df
    else:
        print(f"Warning: Contracts file not found at {contracts_path}")
        return pd.DataFrame()


def detect_price_drifts(
    pos_df: pd.DataFrame,
    contracts_df: pd.DataFrame,
    drift_threshold: float = 1.05
) -> pd.DataFrame:
    """
    Detect price drifts in purchase orders compared to contracts.
    
    Args:
        pos_df: Purchase orders dataframe
        contracts_df: Contracts reference dataframe
        drift_threshold: Threshold ratio above which drift is flagged
    
    Returns:
        pd.DataFrame: Detected drifts
    """
    if contracts_df.empty:
        print("Warning: No contracts data, cannot detect drifts")
        return pd.DataFrame()
    
    # Ensure contract_id is string in both dataframes
    pos_df = pos_df.copy()
    contracts_df = contracts_df.copy()
    
    if 'contract_id' in pos_df.columns:
        pos_df['contract_id'] = pos_df['contract_id'].astype(str)
    if 'contract_id' in contracts_df.columns:
        contracts_df['contract_id'] = contracts_df['contract_id'].astype(str)
    
    # Merge POs with contracts
    merged_df = pd.merge(
        pos_df,
        contracts_df,
        on="contract_id",
        how="left",
        suffixes=('_po', '_contract')
    )
    
    # Filter for POs with a contract
    contracted_pos = merged_df[merged_df['contract_unit_price'].notna()].copy()
    
    if contracted_pos.empty:
        print("No POs found with matching contracts")
        return pd.DataFrame()
    
    # Calculate price drift ratio
    contracted_pos['price_drift'] = (
        contracted_pos['unit_price'] / contracted_pos['contract_unit_price']
    )
    
    # Detect drifts above threshold
    drifts = contracted_pos[contracted_pos['price_drift'] > drift_threshold].copy()
    
    # Calculate drift percentage for readability
    drifts['drift_percent'] = ((drifts['price_drift'] - 1) * 100).round(2)
    
    return drifts


def save_predictions(
    predictions: pd.DataFrame,
    output_dir: str,
    prefix: str = "predictions"
) -> str:
    """
    Save predictions to CSV file.
    
    Args:
        predictions: Predictions dataframe
        output_dir: Output directory
        prefix: Filename prefix
    
    Returns:
        str: Path to saved file
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{prefix}_{timestamp}.csv"
    filepath = output_path / filename
    
    predictions.to_csv(filepath, index=False)
    print(f"Saved predictions to: {filepath}")
    
    return str(filepath)


def print_sample_predictions(predictions: pd.DataFrame, n: int = 5):
    """Print sample predictions for review."""
    print("\n" + "=" * 60)
    print("SAMPLE PREDICTIONS")
    print("=" * 60)
    
    if predictions.empty:
        print("No drifts detected")
        return
    
    # Select relevant columns for display
    display_cols = [
        'po_id', 'contract_id', 'unit_price', 
        'contract_unit_price', 'price_drift', 'drift_percent'
    ]
    available_cols = [c for c in display_cols if c in predictions.columns]
    
    sample = predictions[available_cols].head(n)
    print(sample.to_string(index=False))
    print(f"\nShowing {len(sample)} of {len(predictions)} total drifts")


def main():
    parser = argparse.ArgumentParser(
        description="Run inference for Procurement Price-Drift Detection",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    parser.add_argument(
        "--model-path",
        type=str,
        required=True,
        help="Path to trained model artifact directory"
    )
    parser.add_argument(
        "--data-path",
        type=str,
        required=True,
        help="Path to data file (CSV) or directory containing pos.csv"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="outputs",
        help="Directory to save prediction outputs"
    )
    parser.add_argument(
        "--drift-threshold",
        type=float,
        default=None,
        help="Override drift threshold from model config"
    )
    parser.add_argument(
        "--print-samples",
        action="store_true",
        help="Print sample predictions to console"
    )
    parser.add_argument(
        "--sample-count",
        type=int,
        default=10,
        help="Number of sample predictions to print"
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("PROCUREMENT PRICE-DRIFT DETECTION - INFERENCE")
    print("=" * 60)
    
    # Step 1: Load model
    print("\nStep 1: Loading model...")
    try:
        model_config = load_model(args.model_path)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    # Use threshold from args or model config
    drift_threshold = args.drift_threshold or model_config.get("drift_threshold", 1.05)
    print(f"Using drift threshold: {drift_threshold}")
    
    # Step 2: Load data
    print("\nStep 2: Loading data...")
    try:
        pos_df = load_data(args.data_path)
        contracts_df = load_contracts(args.data_path)
    except FileNotFoundError as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    # Step 3: Run inference
    print("\nStep 3: Running inference...")
    predictions = detect_price_drifts(pos_df, contracts_df, drift_threshold)
    
    print(f"\nDetected {len(predictions)} price drifts")
    
    # Step 4: Save predictions
    print("\nStep 4: Saving predictions...")
    output_file = save_predictions(predictions, args.output_dir)
    
    # Print samples if requested
    if args.print_samples:
        print_sample_predictions(predictions, args.sample_count)
    
    # Summary statistics
    print("\n" + "=" * 60)
    print("INFERENCE COMPLETE")
    print("=" * 60)
    print(f"Total POs processed: {len(pos_df)}")
    print(f"Drifts detected: {len(predictions)}")
    if len(predictions) > 0:
        print(f"Average drift: {predictions['drift_percent'].mean():.2f}%")
        print(f"Max drift: {predictions['drift_percent'].max():.2f}%")
    print(f"Output saved to: {output_file}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
