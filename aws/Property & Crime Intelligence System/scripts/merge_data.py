"""
Merges cleaned property and crime data by postcode_area.
Produces data/processed/merged_data.csv and updates merged_data table in DB.
"""

import os
import sys
import logging
import pandas as pd
import psycopg2

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("merge_data")


def load_properties() -> pd.DataFrame:
    path = os.path.join(config.PROCESSED_DIR, "properties_clean.csv")
    df = pd.read_csv(path, low_memory=False)
    logger.info(f"Loaded {len(df)} clean property rows")
    return df


def load_crime() -> pd.DataFrame:
    path = os.path.join(config.PROCESSED_DIR, "crime_clean.csv")
    df = pd.read_csv(path, low_memory=False)
    logger.info(f"Loaded {len(df)} clean crime rows")
    return df


def aggregate_properties(df: pd.DataFrame) -> pd.DataFrame:
    sale = df[df["listing_type"] == "sale"].groupby("postcode_area")["price"].mean().rename("avg_sale_price")
    rent = df[df["listing_type"] == "rent"].groupby("postcode_area")["price"].mean().rename("avg_rent_price")
    return pd.concat([sale, rent], axis=1).reset_index()


def aggregate_crime(df: pd.DataFrame) -> pd.DataFrame:
    return (
        df.groupby("postcode_area")
        .size()
        .reset_index(name="crime_count")
    )


def merge(prop_agg: pd.DataFrame, crime_agg: pd.DataFrame) -> pd.DataFrame:
    merged = prop_agg.merge(crime_agg, on="postcode_area", how="outer")
    merged["avg_sale_price"] = merged["avg_sale_price"].fillna(0)
    merged["avg_rent_price"] = merged["avg_rent_price"].fillna(0)
    merged["crime_count"] = merged["crime_count"].fillna(0).astype(int)
    logger.info(f"Merged dataset: {len(merged)} postcode areas")
    return merged


def save(df: pd.DataFrame):
    os.makedirs(config.PROCESSED_DIR, exist_ok=True)
    path = os.path.join(config.PROCESSED_DIR, "merged_data.csv")
    df.to_csv(path, index=False)
    logger.info(f"Saved → {path}")
    return path


def main():
    props = load_properties()
    crimes = load_crime()

    prop_agg = aggregate_properties(props)
    crime_agg = aggregate_crime(crimes)
    merged = merge(prop_agg, crime_agg)

    save(merged)


if __name__ == "__main__":
    main()
