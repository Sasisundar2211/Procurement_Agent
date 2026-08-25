# data_generator.py
import datetime
import os
from pathlib import Path
import random
import numpy as np
import pandas as pd

OUT = Path("/tmp/procureguard-data") if os.getenv("VERCEL") else Path("data")
PRIVATE = OUT/"private"
PUBLIC = OUT/"public"
PRIVATE.mkdir(parents=True, exist_ok=True)
PUBLIC.mkdir(parents=True, exist_ok=True)

def gen_items(n=200):
    return [{"item_id": f"ITEM{str(i).zfill(4)}", "base_price": round(random.uniform(5,500),2)} for i in range(n)]

def gen_vendors(n=20):
    return [{"vendor_id": f"V{str(i).zfill(3)}", "name": f"Vendor_{i}"} for i in range(n)]

def gen_contracts(vendors, items, n_contracts=30):
    rows=[]
    for i in range(n_contracts):
        vendor=random.choice(vendors)
        item=random.choice(items)
        price = round(item["base_price"]*random.uniform(0.9,1.1),2)
        expiry = (datetime.date.today() + datetime.timedelta(days=random.randint(30,365))).isoformat()
        rows.append({
            "contract_id": f"C{str(i).zfill(4)}",
            "vendor_id": vendor["vendor_id"],
            "item_id": item["item_id"],
            "contract_unit_price": price,
            "expiry_date": expiry
        })
    return pd.DataFrame(rows)

def gen_pos(vendors, items, contracts_df, n_pos=2000, leak_prob=0.03):
    rng = np.random
    vendor_indices = rng.randint(0, len(vendors), n_pos)
    item_indices = rng.randint(0, len(items), n_pos)
    has_contract = rng.random(n_pos) < 0.7
    contract_indices = rng.randint(0, len(contracts_df), n_pos)
    is_leak = rng.random(n_pos) < leak_prob
    base_multipliers = rng.uniform(0.95, 1.05, n_pos)
    leak_multipliers = np.where(is_leak, rng.uniform(1.10, 1.40, n_pos), 1.0)
    qtys = rng.randint(1, 51, n_pos)
    days_ago = rng.randint(0, 181, n_pos)

    today = datetime.date.today()
    rows = []
    labels = []
    contracts_records = contracts_df.to_dict('records')

    for i in range(n_pos):
        vendor = vendors[vendor_indices[i]]
        item = items[item_indices[i]]

        contract = None
        if has_contract[i]:
            c = contracts_records[contract_indices[i]]
            if c["vendor_id"] == vendor["vendor_id"]:
                contract = c

        unit_price = item["base_price"] * base_multipliers[i] * leak_multipliers[i]
        qty = int(qtys[i])
        total = round(unit_price * qty, 2)
        po_id = f"PO{str(i).zfill(6)}"
        rows.append({
            "po_id": po_id,
            "vendor_id": vendor["vendor_id"],
            "item_id": item["item_id"],
            "unit_price": round(unit_price, 2),
            "qty": qty,
            "total": total,
            "date": (today - datetime.timedelta(days=int(days_ago[i]))).isoformat(),
            "contract_id": contract["contract_id"] if contract is not None else ""
        })
        labels.append({"po_id": po_id, "leak": is_leak[i]})
    return pd.DataFrame(rows), pd.DataFrame(labels)

if __name__ == "__main__":
    items=gen_items()
    vendors=gen_vendors()
    contracts_df = gen_contracts(vendors, items, n_contracts=40)
    pos_df, labels_df = gen_pos(vendors, items, contracts_df, n_pos=2000, leak_prob=0.03)
    contracts_df.to_csv(PRIVATE/"contracts_full.csv", index=False)
    pos_df.to_csv(PRIVATE/"pos_full.csv", index=False)
    labels_df.to_csv(PRIVATE/"pos_labels.csv", index=False)
    contracts_df.to_csv(PUBLIC/"contracts.csv", index=False)
    pos_df.to_csv(PUBLIC/"pos.csv", index=False)
    print("Data generated. PRIVATE labels are in data/private/pos_labels.csv")
