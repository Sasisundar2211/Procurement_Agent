import pandas as pd
import numpy as np
from src.agents.price_detector import engine
import uuid
import os

def ingest_sf_data():
    print("Reading SF Procurement Data...")
    # Read only necessary columns to save memory
    use_cols = [
        'Purchase Order Date', 'Purchase Order', 'Contract Number', 'Contract Title',
        'Supplier & Other Non-Supplier Payees', 'Encumbered Quantity', 'Encumbered Amount'
    ]
    
    # Construct path to data file relative to the script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(script_dir, 'data', 'sf_data', 'sf_procurement.csv')

    # Note: Column names might vary slightly, I'll try to be robust or read all and rename
    try:
        df = pd.read_csv(data_path, usecols=use_cols)
    except ValueError:
        # Fallback if columns are named differently (e.g. from the truncated output I saw)
        # Let's read all and print columns if this fails, but for now assume standard names
        df = pd.read_csv(data_path)
    
    print(f"Loaded {len(df)} rows.")

    # Clean data
    df = df.dropna(subset=['Encumbered Quantity', 'Encumbered Amount', 'Supplier & Other Non-Supplier Payees'])
    df = df[df['Encumbered Quantity'] > 0]
    df = df[df['Encumbered Amount'] > 0]
    
    # Calculate Unit Price
    df['unit_price'] = df['Encumbered Amount'] / df['Encumbered Quantity']
    
    # Filter out unreasonable prices (e.g. near zero or infinity)
    df = df[df['unit_price'] > 0.01]
    
    # Rename columns to match our schema
    df = df.rename(columns={
        'Purchase Order': 'po_id',
        'Purchase Order Date': 'date',
        'Contract Number': 'contract_id',
        'Supplier & Other Non-Supplier Payees': 'vendor_id',
        'Contract Title': 'item_id', # Using Contract Title as Item Name for simplicity
        'Encumbered Quantity': 'qty',
        'Encumbered Amount': 'total'
    })
    
    # Handle missing Contract IDs (some POs might be open market)
    # For this demo, we want to detect drifts against contracts, so we'll prioritize rows with contracts.
    # Or we can generate fake contract IDs for those missing them.
    df['contract_id'] = df['contract_id'].fillna('OPEN_MARKET')
    
    # --- Generate Contracts Table ---
    # We assume the "Contract Price" is the median price seen for that item/contract combo
    print("Generating Contracts Reference Data...")
    contracts_ref = df.groupby(['contract_id', 'item_id', 'vendor_id'])['unit_price'].median().reset_index()
    contracts_ref = contracts_ref.rename(columns={'unit_price': 'contract_unit_price'})
    
    # Add dummy expiry date
    contracts_ref['expiry_date'] = '2025-12-31'
    
    # Filter out OPEN_MARKET for contracts table if we want strict enforcement, 
    # but for now let's keep them to show we have data.
    
    # --- Generate POs Table ---
    # We'll take a sample of the POs to avoid overwhelming the DB if the file is huge
    # The file is ~900MB, so we definitely need to sample.
    print("Sampling POs...")
    pos_sample = df.sample(n=5000, random_state=42).copy() # 5000 POs is plenty for a demo
    
    # --- Inject Artificial Leaks ---
    # Since real data is usually compliant, we need to inject some drifts for the demo.
    # We'll increase the unit price by 25% for 10% of the rows.
    num_leaks = int(len(pos_sample) * 0.10)
    leak_indices = np.random.choice(pos_sample.index, num_leaks, replace=False)
    
    print(f"Injecting {num_leaks} artificial leaks...")
    pos_sample.loc[leak_indices, 'unit_price'] *= 1.25
    # Recalculate total for consistency
    pos_sample.loc[leak_indices, 'total'] = pos_sample.loc[leak_indices, 'unit_price'] * pos_sample.loc[leak_indices, 'qty']
    
    # Ensure we format dates correctly
    pos_sample['date'] = pd.to_datetime(pos_sample['date']).dt.date.astype(str)
    
    # --- Insert into DB ---
    print("Inserting into Database...")
    
    # Clear existing data? Maybe not, let's append or replace. 
    # For a clean demo, replacing is better.
    contracts_ref.to_sql('contracts', engine, if_exists='replace', index=False)
    pos_sample.to_sql('pos', engine, if_exists='replace', index=False)
    
    print(f"Ingested {len(contracts_ref)} contracts and {len(pos_sample)} POs.")

if __name__ == "__main__":
    ingest_sf_data()
