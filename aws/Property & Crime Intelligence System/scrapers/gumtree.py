"""
Gumtree scraper — London property (sale + rent).
Parses JSON-LD (schema.org) embedded in HTML — more stable than CSS class selectors
since Gumtree uses CSS-in-JS which changes on every deploy.
"""

import re
import json
import requests
from bs4 import BeautifulSoup
from base_scraper import BaseScraper


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-GB,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

BASE_URL = "https://www.gumtree.com"

SEARCH_CONFIGS = [
    {
        "listing_type": "rent",
        "url_template": "https://www.gumtree.com/flats-houses/uk/london?page={page}",
    },
    {
        "listing_type": "sale",
        "url_template": "https://www.gumtree.com/property-for-sale/uk/london?page={page}",
    },
]


def _postcode_area(text: str) -> str:
    match = re.search(r"\b([A-Z]{1,2}\d{1,2})\b", text.upper())
    return match.group(1) if match else ""


def _parse_bedrooms(text: str):
    match = re.search(r"(\d+)\s*(bed|bedroom|br)\b", text, re.I)
    return int(match.group(1)) if match else None


def _extract_json_ld(html: str) -> list[dict]:
    """Extract all JSON-LD blocks from the page and return listing items."""
    soup = BeautifulSoup(html, "lxml")
    items = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            # schema.org ItemList
            if isinstance(data, dict) and data.get("@type") == "ItemList":
                for element in data.get("itemListElement", []):
                    items.append(element)
            # Single listing
            elif isinstance(data, dict) and data.get("@type") == "Product":
                items.append({"item": data})
        except (json.JSONDecodeError, TypeError):
            continue
    return items


class GumtreeScraper(BaseScraper):
    SOURCE_NAME = "gumtree"

    def scrape(self) -> list[dict]:
        results = []

        for cfg in SEARCH_CONFIGS:
            listing_type = cfg["listing_type"]
            page = 1

            while page <= self.max_pages:
                url = cfg["url_template"].format(page=page)
                try:
                    resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
                    if resp.status_code == 404:
                        break
                    resp.raise_for_status()
                except requests.RequestException as e:
                    self.logger.error(f"[{listing_type}] Page {page} failed: {e}")
                    break

                json_items = _extract_json_ld(resp.text)

                if not json_items:
                    self.logger.info(f"[{listing_type}] No JSON-LD items on page {page} — stopping")
                    break

                for item in json_items:
                    try:
                        # JSON-LD structure: {"@type":"ListItem", "position":1, "url":"...", "item": {...}}
                        listing = item.get("item", item)
                        if not isinstance(listing, dict):
                            continue

                        name = listing.get("name", "") or ""
                        description = listing.get("description", "") or ""
                        full_text = f"{name} {description}"

                        # Price from offers
                        offers = listing.get("offers", {}) or {}
                        price = offers.get("price") or listing.get("price")
                        try:
                            price = float(price) if price else None
                        except (ValueError, TypeError):
                            price = None

                        url_val = item.get("url") or listing.get("url") or ""

                        results.append({
                            "source": self.SOURCE_NAME,
                            "listing_type": listing_type,
                            "title": name,
                            "price": price,
                            "postcode": "",
                            "postcode_area": _postcode_area(full_text),
                            "lat": None,
                            "lng": None,
                            "bedrooms": _parse_bedrooms(full_text),
                            "property_type": None,
                            "url": url_val,
                        })
                    except Exception as e:
                        self.logger.warning(f"Failed to parse item: {e}")

                self.log_page(page, len(results))
                page += 1
                self.wait()

        return results


if __name__ == "__main__":
    scraper = GumtreeScraper()
    scraper.run()
