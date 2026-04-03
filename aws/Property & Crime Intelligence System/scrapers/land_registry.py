"""
Land Registry Price Paid scraper.
Downloads the current year's CSV from the official gov.uk dataset.
Filters to London postcodes only.
Free, no key required.
"""

import re
import io
import requests
import pandas as pd
from datetime import date
from base_scraper import BaseScraper

# Land Registry publishes monthly updated CSVs
PRICE_PAID_URL = (
    "http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com"
    "/pp-{year}.csv"
)

# Regex matching valid London postcode AREAS only (letter+digit prefix).
# Simple startswith("N") would incorrectly match NE (Northeast England), NP (Wales) etc.
import re as _re
LONDON_AREA_RE = _re.compile(
    r"^("
    r"E\d|EC\d|"
    r"N\d|NW\d|"
    r"SE\d|SW\d|"
    r"W\d|WC\d|"
    r"BR\d|CR\d|DA\d|EN\d|HA\d|IG\d|KT\d|RM\d|SM\d|TW\d|UB\d|WD\d"
    r")",
    _re.IGNORECASE,
)

COLUMNS = [
    "transaction_id", "price", "date", "postcode", "property_type",
    "new_build", "tenure", "paon", "saon", "street", "locality",
    "town", "district", "county", "ppd_category", "record_status",
]

PROP_TYPE_MAP = {
    "D": "detached",
    "S": "semi-detached",
    "T": "terraced",
    "F": "flat",
    "O": "other",
}


def _postcode_area(postcode: str) -> str:
    match = re.match(r"^([A-Z]{1,2}\d{1,2})", postcode.upper().strip())
    return match.group(1) if match else ""


class LandRegistryScraper(BaseScraper):
    SOURCE_NAME = "land_registry"

    def scrape(self) -> list[dict]:
        year = date.today().year
        url = PRICE_PAID_URL.format(year=year)
        self.logger.info(f"Downloading Land Registry data for {year}: {url}")

        try:
            resp = requests.get(url, timeout=120, stream=True)
            resp.raise_for_status()
        except requests.RequestException as e:
            self.logger.error(f"Download failed: {e}")
            return []

        self.logger.info("Download complete — parsing CSV")
        df = pd.read_csv(
            io.StringIO(resp.content.decode("utf-8", errors="replace")),
            header=None,
            names=COLUMNS,
            low_memory=False,
        )

        # Filter to London postcodes using exact area regex (avoids NE/NP/NG etc.)
        df["postcode"] = df["postcode"].fillna("").str.strip()
        london_mask = df["postcode"].str.match(LONDON_AREA_RE)
        df = df[london_mask].copy()
        self.logger.info(f"London records: {len(df)}")

        results = []
        for _, row in df.iterrows():
            postcode = str(row["postcode"])
            results.append({
                "source": self.SOURCE_NAME,
                "listing_type": "sale",
                "title": f"{row.get('paon', '')} {row.get('street', '')}".strip(),
                "price": float(row["price"]) if pd.notna(row["price"]) else None,
                "postcode": postcode,
                "postcode_area": _postcode_area(postcode),
                "lat": None,
                "lng": None,
                "bedrooms": None,
                "property_type": PROP_TYPE_MAP.get(str(row.get("property_type", "")), None),
                "url": None,
            })

        return results


if __name__ == "__main__":
    scraper = LandRegistryScraper()
    scraper.run()
