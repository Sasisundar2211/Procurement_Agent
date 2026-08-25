from __future__ import annotations

import pandas as pd
from sqlalchemy.engine import Engine

from data_generator import gen_items, gen_vendors, gen_pos
from src.utils.database import get_engine


def simulate_traffic(
    n_pos: int = 50,
    leak_probability: float = 0.5,
    engine_override: Engine | None = None,
) -> int:
    engine = engine_override or get_engine()

    contracts_df = pd.read_sql("select * from contracts", engine)
    if contracts_df.empty:
        raise ValueError("No contracts found. Run ingestion first.")

    items = gen_items(n=50)
    vendors = gen_vendors(n=10)

    new_pos_df, _ = gen_pos(
        vendors,
        items,
        contracts_df,
        n_pos=n_pos,
        leak_prob=leak_probability,
    )
    new_pos_df.to_sql("pos", engine, if_exists="append", index=False)
    return len(new_pos_df)
