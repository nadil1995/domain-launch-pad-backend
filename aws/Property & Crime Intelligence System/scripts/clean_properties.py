"""
Cleans property data from all sources.
Reads from DB, normalises, writes cleaned CSV to data/processed/.
"""

import os
import sys
import logging
import re
import pandas as pd
from sqlalchemy import create_engine

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("clean_properties")


def load_from_db() -> pd.DataFrame:
    engine = create_engine(config.DATABASE_URL)
    with engine.connect() as conn:
        df = pd.read_sql("SELECT * FROM properties", conn)
    logger.info(f"Loaded {len(df)} rows from DB")
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    # Drop rows with no price
    before = len(df)
    df = df.dropna(subset=["price"])
    logger.info(f"Dropped {before - len(df)} rows with no price")

    # Price must be positive and within plausible range
    if "listing_type" in df.columns:
        # Sale: £10k–£50m; Rent: £100–£100k per month
        sale_mask = (df["listing_type"] == "sale") & df["price"].between(10_000, 50_000_000)
        rent_mask = (df["listing_type"] == "rent") & df["price"].between(100, 100_000)
        df = df[sale_mask | rent_mask].copy()
        logger.info(f"After price range filter: {len(df)} rows")

    # Standardise postcode: uppercase, strip whitespace
    df["postcode"] = df["postcode"].fillna("").str.upper().str.strip()

    # Re-derive postcode_area from postcode where missing
    def extract_area(postcode: str) -> str:
        match = re.match(r"^([A-Z]{1,2}\d{1,2})", postcode)
        return match.group(1) if match else ""

    df["postcode_area"] = df.apply(
        lambda r: r["postcode_area"] if r.get("postcode_area") else extract_area(r["postcode"]),
        axis=1,
    )

    # Drop rows with no postcode area (can't locate them)
    before = len(df)
    df = df[df["postcode_area"] != ""]
    logger.info(f"Dropped {before - len(df)} rows with no postcode area")

    # Standardise property_type
    type_map = {
        "flat": "flat", "apartment": "flat",
        "terraced": "terraced", "terrace": "terraced",
        "detached": "detached",
        "semi": "semi-detached", "semi-detached": "semi-detached",
        "studio": "studio",
        "bungalow": "bungalow",
        "house": "house",
    }
    df["property_type"] = (
        df["property_type"]
        .fillna("")
        .str.lower()
        .map(lambda t: next((v for k, v in type_map.items() if k in t), t or None))
    )

    # Bedrooms: must be 0–20
    df["bedrooms"] = pd.to_numeric(df["bedrooms"], errors="coerce")
    df.loc[~df["bedrooms"].between(0, 20), "bedrooms"] = None

    # Reset index
    df = df.reset_index(drop=True)
    logger.info(f"Clean dataset: {len(df)} rows")
    return df


def save(df: pd.DataFrame):
    os.makedirs(config.PROCESSED_DIR, exist_ok=True)
    path = os.path.join(config.PROCESSED_DIR, "properties_clean.csv")
    df.to_csv(path, index=False)
    logger.info(f"Saved → {path}")
    return path


def main():
    df = load_from_db()
    df = clean(df)
    save(df)


if __name__ == "__main__":
    main()
