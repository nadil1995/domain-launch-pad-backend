"""
Computes investment_score for each postcode area.

Formula:
  investment_score = 0.5 * (1 - normalized_price) + 0.5 * (1 - normalized_crime)

Score range: 0.0 (worst) to 1.0 (best).
Higher score = cheaper AND lower crime = better investment.

Writes score back to merged_data.csv and to the merged_data DB table.
"""

import os
import sys
import logging
import boto3
import pandas as pd
import psycopg2
from sklearn.preprocessing import MinMaxScaler

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("scoring")

PRICE_WEIGHT = 0.5
CRIME_WEIGHT = 0.5


def load() -> pd.DataFrame:
    path = os.path.join(config.PROCESSED_DIR, "merged_data.csv")
    df = pd.read_csv(path)
    logger.info(f"Loaded {len(df)} postcode areas")
    return df


def score(df: pd.DataFrame) -> pd.DataFrame:
    scaler = MinMaxScaler()

    # Use avg_sale_price if available, fall back to avg_rent_price
    df["price_for_scoring"] = df["avg_sale_price"].replace(0, None).fillna(df["avg_rent_price"])

    # Drop areas with no price at all
    before = len(df)
    df = df.dropna(subset=["price_for_scoring"]).copy()
    logger.info(f"Dropped {before - len(df)} areas with no price data")

    if df.empty:
        logger.warning("No data to score — skipping. Run scrapers first.")
        return df

    # Normalise price and crime to [0, 1]
    df["norm_price"] = scaler.fit_transform(df[["price_for_scoring"]])
    df["norm_crime"] = scaler.fit_transform(df[["crime_count"]])

    # Invert: lower price / lower crime → higher score
    df["investment_score"] = (
        PRICE_WEIGHT * (1 - df["norm_price"]) +
        CRIME_WEIGHT * (1 - df["norm_crime"])
    ).round(4)

    df = df.sort_values("investment_score", ascending=False).reset_index(drop=True)
    logger.info(f"Top 5 investment areas:\n{df[['postcode_area','avg_sale_price','avg_rent_price','crime_count','investment_score']].head()}")
    return df


def save_csv(df: pd.DataFrame):
    path = os.path.join(config.PROCESSED_DIR, "merged_data.csv")
    df.to_csv(path, index=False)
    logger.info(f"Saved scored data → {path}")
    return path


def upload_to_s3(path: str):
    if not config.S3_ENABLED:
        logger.info("S3 not configured — skipping upload")
        return
    s3 = boto3.client(
        "s3",
        region_name=config.AWS_REGION,
        aws_access_key_id=config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
    )
    key = f"processed/{os.path.basename(path)}"
    s3.upload_file(path, config.S3_BUCKET, key)
    logger.info(f"Uploaded to s3://{config.S3_BUCKET}/{key}")


def save_to_db(df: pd.DataFrame):
    conn = psycopg2.connect(config.DATABASE_URL)
    cur = conn.cursor()

    cur.execute("TRUNCATE TABLE merged_data")

    sql = """
        INSERT INTO merged_data
            (postcode_area, avg_sale_price, avg_rent_price, crime_count, investment_score)
        VALUES
            (%(postcode_area)s, %(avg_sale_price)s, %(avg_rent_price)s,
             %(crime_count)s, %(investment_score)s)
        ON CONFLICT (postcode_area) DO UPDATE SET
            avg_sale_price   = EXCLUDED.avg_sale_price,
            avg_rent_price   = EXCLUDED.avg_rent_price,
            crime_count      = EXCLUDED.crime_count,
            investment_score = EXCLUDED.investment_score,
            updated_at       = NOW()
    """

    rows = df[["postcode_area", "avg_sale_price", "avg_rent_price", "crime_count", "investment_score"]].to_dict("records")
    cur.executemany(sql, rows)
    conn.commit()
    cur.close()
    conn.close()
    logger.info(f"Inserted/updated {len(rows)} rows in merged_data table")


def main():
    df = load()
    df = score(df)
    if df.empty:
        return
    path = save_csv(df)
    upload_to_s3(path)
    save_to_db(df)


if __name__ == "__main__":
    main()
