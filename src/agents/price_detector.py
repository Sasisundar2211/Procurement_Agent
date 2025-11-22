# src/agents/price_detector.py
import pandas as pd
import os

def detect_public_only():
    if not (os.path.exists("data/public/pos.csv") and os.path.exists("data/public/contracts.csv")):
        return pd.DataFrame()

    pos_df = pd.read_csv("data/public/pos.csv")
    contracts_df = pd.read_csv("data/public/contracts.csv")

    # Merge POs with contracts
    merged_df = pd.merge(pos_df, contracts_df, on="contract_id", how="left", suffixes=('_po', '_contract'))
    
    # Filter for POs with a contract
    contracted_pos = merged_df[merged_df['contract_unit_price'].notna()].copy()
    
    # Detect price drift (e.g., PO unit price is >5% higher than contract price)
    drift_threshold = 1.05
    contracted_pos['price_drift'] = contracted_pos['unit_price'] / contracted_pos['contract_unit_price']
    
    drifts = contracted_pos[contracted_pos['price_drift'] > drift_threshold]
    
    return drifts

def evaluate_with_private_labels():
    # ... (not implemented for now)
    pass