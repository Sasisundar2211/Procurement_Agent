# data_generator.py
import pandas as pd, numpy as np, random, datetime, json
from pathlib import Path
OUT = Path("data")
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
    rows=[]
    labels=[]
    for i in range(n_pos):
        vendor=random.choice(vendors)
        item=random.choice(items)
        contract = contracts_df.sample(1).iloc[0] if random.random() < 0.7 else None
        if contract is not None and contract["vendor_id"] != vendor["vendor_id"]:
            contract = None
        base = item["base_price"]
        unit_price = base * random.uniform(0.95,1.05)
        leak=False
        if random.random() < leak_prob:
            unit_price *= random.uniform(1.10,1.40)
            leak=True
        qty = random.randint(1,50)
        total = round(unit_price * qty,2)
        po_id = f"PO{str(i).zfill(6)}"
        rows.append({
            "po_id": po_id,
            "vendor_id": vendor["vendor_id"],
            "item_id": item["item_id"],
            "unit_price": round(unit_price,2),
            "qty": qty,
            "total": total,
            "date": (datetime.date.today() - datetime.timedelta(days=random.randint(0,180))).isoformat(),
            "contract_id": contract["contract_id"] if contract is not None else ""
        })
        labels.append({"po_id": po_id, "leak": leak})
    return pd.DataFrame(rows), pd.DataFrame(labels)

if __name__ == "__main__":
    items=gen_items()
    vendors=gen_vendors()
    contracts_df = gen_contracts(vendors, items, n_contracts=40)
    pos_df, labels_df = gen_pos(vendors, items, contracts_df, n_pos=2000, leak_prob=0.03)
    # Save private (includes labels)
    contracts_df.to_csv(PRIVATE/"contracts_full.csv", index=False)
    pos_df.to_csv(PRIVATE/"pos_full.csv", index=False)
    labels_df.to_csv(PRIVATE/"pos_labels.csv", index=False)
    # Create public versions (strip labels, provide minimal contract mapping but not labels)
    contracts_df.to_csv(PUBLIC/"contracts.csv", index=False)
    pos_df.to_csv(PUBLIC/"pos.csv", index=False)
    # Also create a compressed archive for submission artifacts generator
    print("Data generated. PRIVATE labels are in data/private/pos_labels.csv")