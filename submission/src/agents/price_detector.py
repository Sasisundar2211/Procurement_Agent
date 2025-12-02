# src/agents/price_detector.py
import pandas as pd
import os
from sqlalchemy import create_engine, inspect

# Use the same database URL as the ingestor, with a fallback
db_url = os.getenv("DATABASE_URL", "sqlite:///data/procure.db")
engine = create_engine(db_url)

def detect_public_only(drift_threshold: float | None = None):
    """
    Detects price drifts in public data.
    
    A "drift" is when a purchase order's unit price is significantly higher than
    the agreed-upon price in the contract.
    """
    if drift_threshold is None:
        drift_threshold = 1.05
    else:
        drift_threshold = 1 + (drift_threshold / 100.0)

    inspector = inspect(engine)
    if not inspector.has_table("pos") or not inspector.has_table("contracts"):
        print("Database tables not found. Please run the ingestor first.")
        # Return an empty dataframe with the expected columns
        return pd.DataFrame(columns=['po_id', 'vendor_id', 'item_id', 'unit_price', 'qty', 'total', 'date', 'contract_id', 'contract_unit_price', 'price_drift'])

    try:
        pos_df = pd.read_sql("select * from pos", engine)
        contracts_df = pd.read_sql("select * from contracts", engine)
    except Exception as e:
        print(f"Error reading from database: {e}")
        return pd.DataFrame(columns=['po_id', 'vendor_id', 'item_id', 'unit_price', 'qty', 'total', 'date', 'contract_id', 'contract_unit_price', 'price_drift'])

    if pos_df.empty or contracts_df.empty:
        print("No data in POs or contracts table.")
        return pd.DataFrame(columns=['po_id', 'vendor_id', 'item_id', 'unit_price', 'qty', 'total', 'date', 'contract_id', 'contract_unit_price', 'price_drift'])

    # Ensure contract_id is the same type in both dataframes
    pos_df['contract_id'] = pos_df['contract_id'].astype(str)
    contracts_df['contract_id'] = contracts_df['contract_id'].astype(str)

    # Merge POs with contracts
    merged_df = pd.merge(pos_df, contracts_df, on="contract_id", how="left", suffixes=('_po', '_contract'))
    
    # Filter for POs with a contract
    contracted_pos = merged_df[merged_df['contract_unit_price'].notna()].copy()
    
    if contracted_pos.empty:
        return pd.DataFrame(columns=['po_id', 'vendor_id', 'item_id', 'unit_price', 'qty', 'total', 'date', 'contract_id', 'contract_unit_price', 'price_drift'])

    # Detect price drift
    contracted_pos['price_drift'] = contracted_pos['unit_price'] / contracted_pos['contract_unit_price']
    
    drifts = contracted_pos[contracted_pos['price_drift'] > drift_threshold].copy()
    
    # Rename columns to match frontend expectation
    drifts.rename(columns={
        'vendor_id_po': 'vendor_id',
        'item_id_po': 'item_id'
    }, inplace=True)
    
    # Ensure we return the columns the frontend expects
    cols_to_keep = ['po_id', 'vendor_id', 'item_id', 'unit_price', 'qty', 'total', 'date', 'contract_id', 'contract_unit_price', 'price_drift']
    
    # Filter for columns that actually exist
    existing_cols = [c for c in cols_to_keep if c in drifts.columns]
    
    # Add missing columns with default values if they don't exist
    for col in cols_to_keep:
        if col not in drifts.columns:
            drifts[col] = None

    # Replace NaN/Inf with None for JSON serialization
    drifts = drifts.replace([float('inf'), float('-inf')], None)
    drifts = drifts.where(pd.notnull(drifts), None)

    return drifts[cols_to_keep]

def evaluate_with_private_labels():
    # ... (not implemented for now)
    pass