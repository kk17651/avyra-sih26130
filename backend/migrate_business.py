from sqlalchemy import text
from database import engine

COLUMNS = [
    "owner_name VARCHAR(120) DEFAULT ''",
    "business_type VARCHAR(60) DEFAULT ''",
    "num_members INTEGER DEFAULT 0",
    "investment_lakh INTEGER DEFAULT 0",
    "uses_hazardous VARCHAR(10) DEFAULT 'No'",
]

with engine.begin() as conn:
    for col in COLUMNS:
        conn.execute(text(f"ALTER TABLE businesses ADD COLUMN IF NOT EXISTS {col}"))

print("Business table updated.")