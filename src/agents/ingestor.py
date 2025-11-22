# src/agents/ingestor.py
import pandas as pd
from sqlalchemy import create_engine
import os

def run():
    print("Ingesting data...")
    db_url = os.getenv("DATABASE_URL", "sqlite:///data/procure.db")
    engine = create_engine(db_url)
    
    public_data_dir = "data/public"
    
    try:
        contracts_df = pd.read_csv(f"{public_data_dir}/contracts.csv")
        contracts_df.to_sql("contracts", engine, if_exists="replace", index=False)
        
        pos_df = pd.read_csv(f"{public_data_dir}/pos.csv")
        pos_df.to_sql("pos", engine, if_exists="replace", index=False)
        
        print("Data ingestion complete.")
    except FileNotFoundError as e:
        print(f"Error: {e}. Make sure you have run data_generator.py first.")

if __name__ == '__main__':
    run()