"""
Extracts crime data for London from the UK Police bulk CSV downloads.
Falls back to the street-level API if the bulk download fails.

Bulk download: https://data.police.uk/data/
Each monthly archive is a zip containing per-force CSVs.
We download the Metropolitan Police and City of London files.
"""

import os
import io
import sys
import csv
import time
import zipfile
import logging
import boto3
import requests
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("extract_crime")

# Bulk download — latest available archive (updated monthly)
BULK_BASE = "https://data.police.uk/data/archive"

# Force name fragments in CSV filenames that cover London
LONDON_FORCES = {
    "metropolitan",
    "city-of-london",
}

# Fallback: street-level API polygon
API_BASE = "https://data.police.uk/api"
LONDON_POLYGON = "51.3,-0.5:51.3,0.3:51.7,0.3:51.7,-0.5"


def get_available_months() -> list[str]:
    """Return the last 3 available months from the API."""
    resp = requests.get(f"{API_BASE}/crimes-street-dates", timeout=15)
    resp.raise_for_status()
    return sorted(d["date"] for d in resp.json())[-3:]


def fetch_via_bulk(months: list[str]) -> list[dict]:
    """Download the latest cumulative zip once and extract London CSVs for target months.

    The archive is cumulative — one zip contains all historical months.
    We download the latest zip (named after the most recent month) and
    filter to only the months we need.
    """
    latest = months[-1]
    url = f"{BULK_BASE}/{latest}.zip"
    logger.info(f"Downloading bulk archive: {url}")
    try:
        resp = requests.get(url, timeout=300, stream=True)
        resp.raise_for_status()
    except requests.RequestException as e:
        logger.warning(f"Bulk download failed ({e})")
        return []

    months_set = set(months)
    crimes = []
    bb = config.LONDON_BBOX

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        for name in zf.namelist():
            # Files: YYYY-MM/YYYY-MM-metropolitan-street.csv
            lower = name.lower()
            if not lower.endswith("-street.csv"):
                continue
            if not any(f in lower for f in LONDON_FORCES):
                continue
            # Only include target months
            month = name.split("/")[0]
            if month not in months_set:
                continue

            logger.info(f"  Reading: {name}")
            with zf.open(name) as f:
                reader = csv.DictReader(io.TextIOWrapper(f, encoding="utf-8"))
                for row in reader:
                    try:
                        lat = float(row.get("Latitude") or 0)
                        lng = float(row.get("Longitude") or 0)
                    except (ValueError, TypeError):
                        continue
                    if not (bb["lat_min"] <= lat <= bb["lat_max"] and
                            bb["lon_min"] <= lng <= bb["lon_max"]):
                        continue
                    crimes.append({
                        "crime_type": (row.get("Crime type") or "unknown").lower().replace("-", " "),
                        "lat": lat,
                        "lng": lng,
                        "postcode_area": "",
                        "month": month,
                    })

    logger.info(f"Bulk: {len(crimes)} London crimes across {months}")
    return crimes


def fetch_via_api(month: str) -> list[dict]:
    """Fallback: street-level API polygon endpoint."""
    url = f"{API_BASE}/crimes-street/all-crime"
    params = {"poly": LONDON_POLYGON, "date": month}
    try:
        resp = requests.get(url, params=params, timeout=60)
        resp.raise_for_status()
        data = resp.json()
    except requests.RequestException as e:
        logger.error(f"  API fallback failed for {month}: {e}")
        return []

    bb = config.LONDON_BBOX
    crimes = []
    for crime in data:
        loc = crime.get("location", {})
        try:
            lat, lng = float(loc.get("latitude", 0)), float(loc.get("longitude", 0))
        except (ValueError, TypeError):
            continue
        if not (bb["lat_min"] <= lat <= bb["lat_max"] and
                bb["lon_min"] <= lng <= bb["lon_max"]):
            continue
        crimes.append({
            "crime_type": crime.get("category", "unknown").lower().replace("-", " "),
            "lat": lat,
            "lng": lng,
            "postcode_area": "",
            "month": month,
        })

    logger.info(f"  API: {len(crimes)} crimes for {month}")
    return crimes


def save_raw(rows: list[dict]) -> str:
    os.makedirs(config.RAW_DIR, exist_ok=True)
    path = os.path.join(config.RAW_DIR, f"crime_{date.today()}.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["crime_type", "lat", "lng", "postcode_area", "month"])
        writer.writeheader()
        writer.writerows(rows)
    logger.info(f"Saved {len(rows)} crime records → {path}")
    return path


def upload_to_s3(path: str):
    if not config.S3_ENABLED:
        logger.info("S3 not configured — skipping")
        return
    s3 = boto3.client(
        "s3",
        region_name=config.AWS_REGION,
        aws_access_key_id=config.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
    )
    key = f"raw/crime/{os.path.basename(path)}"
    s3.upload_file(path, config.S3_BUCKET, key)
    logger.info(f"Uploaded to s3://{config.S3_BUCKET}/{key}")


def insert_to_db(rows: list[dict]):
    if not rows:
        return
    import psycopg2
    from psycopg2.extras import execute_values
    conn = psycopg2.connect(config.DATABASE_URL)
    cur = conn.cursor()
    sql = "INSERT INTO crime (crime_type, lat, lng, postcode_area, month) VALUES %s"
    values = [(r["crime_type"], r["lat"], r["lng"], r["postcode_area"], r["month"]) for r in rows]
    execute_values(cur, sql, values, page_size=1000)
    conn.commit()
    cur.close()
    conn.close()
    logger.info(f"Inserted {len(rows)} crime rows into DB")


def main():
    logger.info("Fetching available months...")
    try:
        months = get_available_months()
        logger.info(f"Will fetch: {months}")
    except Exception as e:
        logger.error(f"Could not get available months: {e}")
        return

    all_crimes = fetch_via_bulk(months)

    if not all_crimes:
        logger.info("Bulk download returned no crimes — trying API fallback per month...")
        for month in months:
            crimes = fetch_via_api(month)
            all_crimes.extend(crimes)
            time.sleep(1)

    logger.info(f"Total London crimes collected: {len(all_crimes)}")
    if not all_crimes:
        logger.warning("No crime data collected — dashboard will show 0 crimes")
        return

    path = save_raw(all_crimes)
    upload_to_s3(path)
    insert_to_db(all_crimes)


if __name__ == "__main__":
    main()
