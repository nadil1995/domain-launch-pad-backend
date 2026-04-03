"""
OpenRent scraper — London rentals.
Uses requests + BeautifulSoup (static HTML).
"""

import re
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
}

BASE_URL = "https://www.openrent.co.uk"
SEARCH_URL = (
    "https://www.openrent.co.uk/properties-to-rent/london"
    "?term=London&bedrooms_min=0&prices_min=0&isLive=true"
)


def _postcode_area(text: str) -> str:
    """Extract postcode area from text, e.g. '2 Bed Flat, London, SW6' → 'SW6'."""
    match = re.search(r"\b([A-Z]{1,2}\d{1,2})\b", text.upper())
    return match.group(1) if match else ""


def _parse_bedrooms(text: str):
    match = re.search(r"(\d+)\s*bed", text, re.I)
    if match:
        return int(match.group(1))
    if re.search(r"studio", text, re.I):
        return 0
    return None


class OpenRentScraper(BaseScraper):
    SOURCE_NAME = "openrent"

    def scrape(self) -> list[dict]:
        results = []
        page = 1

        while page <= self.max_pages:
            url = f"{SEARCH_URL}&page={page}"
            try:
                resp = requests.get(url, headers=HEADERS, timeout=15)
                resp.raise_for_status()
            except requests.RequestException as e:
                self.logger.error(f"Request failed on page {page}: {e}")
                break

            soup = BeautifulSoup(resp.text, "lxml")
            # Updated selector — OpenRent redesigned from a.pli.clearfix → a.pli.search-property-card
            listings = soup.select("a.pli.search-property-card")

            if not listings:
                self.logger.info(f"No more listings at page {page} — stopping")
                break

            for listing in listings:
                try:
                    # Title: "Studio Flat, London, SW6" or "2 Bed Flat, Villiers St, WC2N"
                    title_el = listing.select_one("div.fw-medium.text-primary.fs-3")
                    title = title_el.get_text(strip=True) if title_el else ""

                    # Price: first span.fs-4.fw-medium.text-primary (monthly price)
                    price_el = listing.select_one("span.fs-4.fw-medium.text-primary")
                    price_text = price_el.get_text(strip=True) if price_el else ""
                    price = float(re.sub(r"[^\d.]", "", price_text)) if price_text else None

                    postcode_area = _postcode_area(title)
                    bedrooms = _parse_bedrooms(title)

                    # Property type from title
                    type_match = re.search(
                        r"(flat|apartment|house|studio|room|terraced|detached|semi|bungalow)",
                        title, re.I
                    )
                    prop_type = type_match.group(1).lower() if type_match else None

                    href = listing.get("href", "")
                    url_full = BASE_URL + href if href.startswith("/") else href

                    results.append({
                        "source": self.SOURCE_NAME,
                        "listing_type": "rent",
                        "title": title,
                        "price": price,
                        "postcode": "",
                        "postcode_area": postcode_area,
                        "lat": None,
                        "lng": None,
                        "bedrooms": bedrooms,
                        "property_type": prop_type,
                        "url": url_full,
                    })
                except Exception as e:
                    self.logger.warning(f"Failed to parse listing: {e}")

            self.log_page(page, len(results))
            page += 1
            self.wait()

        return results


if __name__ == "__main__":
    scraper = OpenRentScraper()
    scraper.run()
