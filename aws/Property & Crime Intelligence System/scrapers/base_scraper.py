"""
Base scraper class.
All site-specific scrapers inherit from this.
Provides: rate limiting, retries, S3 upload, DB insert.
"""

import os
import time
import logging
import csv
import boto3
import psycopg2
from psycopg2.extras import execute_values
from abc import ABC, abstractmethod
from datetime import date

import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")


class BaseScraper(ABC):
    SOURCE_NAME: str = ""   # Override in subclass, e.g. "openrent"

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.delay = config.SCRAPER_DELAY
        self.max_pages = config.SCRAPER_MAX_PAGES
        os.makedirs(config.RAW_DIR, exist_ok=True)

    # ------------------------------------------------------------------
    # Abstract interface
    # ------------------------------------------------------------------

    @abstractmethod
    def scrape(self) -> list[dict]:
        """Run the scrape and return a list of property dicts."""
        ...

    # ------------------------------------------------------------------
    # Helpers available to subclasses
    # ------------------------------------------------------------------

    def wait(self):
        time.sleep(self.delay)

    def log_page(self, page: int, count: int):
        self.logger.info(f"Page {page}: collected {count} listings so far")

    # ------------------------------------------------------------------
    # Save raw output locally as CSV
    # ------------------------------------------------------------------

    def save_raw(self, rows: list[dict]) -> str:
        if not rows:
            self.logger.warning("No rows to save — skipping")
            return ""

        filename = f"{self.SOURCE_NAME}_{date.today()}.csv"
        path = os.path.join(config.RAW_DIR, filename)

        fieldnames = rows[0].keys()
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)

        self.logger.info(f"Saved {len(rows)} rows → {path}")
        return path

    # ------------------------------------------------------------------
    # Upload raw file to S3 (skipped if S3 not configured)
    # ------------------------------------------------------------------

    def upload_to_s3(self, local_path: str):
        if not config.S3_ENABLED:
            self.logger.info("S3 not configured — skipping upload")
            return

        s3 = boto3.client(
            "s3",
            region_name=config.AWS_REGION,
            aws_access_key_id=config.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=config.AWS_SECRET_ACCESS_KEY,
        )
        key = f"raw/{self.SOURCE_NAME}/{os.path.basename(local_path)}"
        s3.upload_file(local_path, config.S3_BUCKET, key)
        self.logger.info(f"Uploaded to s3://{config.S3_BUCKET}/{key}")

    # ------------------------------------------------------------------
    # Insert rows into PostgreSQL
    # ------------------------------------------------------------------

    def insert_to_db(self, rows: list[dict]):
        if not rows:
            return

        conn = psycopg2.connect(config.DATABASE_URL)
        cur = conn.cursor()

        insert_sql = """
            INSERT INTO properties
                (source, listing_type, title, price, postcode, postcode_area,
                 lat, lng, bedrooms, property_type, url)
            VALUES %s
        """

        FIELDS = ["source", "listing_type", "title", "price", "postcode",
                  "postcode_area", "lat", "lng", "bedrooms", "property_type", "url"]

        values = [
            tuple(row.get(f) or (self.SOURCE_NAME if f == "source" else None) for f in FIELDS)
            for row in rows
        ]

        execute_values(cur, insert_sql, values, page_size=500)
        conn.commit()
        cur.close()
        conn.close()
        self.logger.info(f"Inserted {len(rows)} rows into DB")

    # ------------------------------------------------------------------
    # Full run: scrape → save → upload → insert
    # ------------------------------------------------------------------

    def run(self):
        self.logger.info(f"Starting scrape: {self.SOURCE_NAME}")
        rows = self.scrape()
        path = self.save_raw(rows)
        if path:
            self.upload_to_s3(path)
        self.insert_to_db(rows)
        self.logger.info(f"Done: {self.SOURCE_NAME} — {len(rows)} listings")
        return rows
