"""
Foxtons scraper — London sale + rent. Agent #1.
Uses Playwright (JS-rendered pages).

To add a new agent scraper:
  1. Copy this file, rename it (e.g. purplebricks.py)
  2. Update SOURCE_NAME and SEARCH_CONFIGS URLs
  3. Adjust CSS selectors in _parse_card() to match the new site
  4. Import and call it in run_all.py
"""

import re
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
from base_scraper import BaseScraper


BASE_URL = "https://www.foxtons.co.uk"

SEARCH_CONFIGS = [
    {
        "listing_type": "sale",
        "url_template": "https://www.foxtons.co.uk/properties-for-sale/london/?page={page}",
    },
    {
        "listing_type": "rent",
        "url_template": "https://www.foxtons.co.uk/properties-to-let/london/?page={page}",
    },
]


def _postcode_area(text: str) -> str:
    match = re.search(r"\b([A-Z]{1,2}\d{1,2})\b", text.upper())
    return match.group(1) if match else ""


def _parse_price(text: str):
    cleaned = re.sub(r"[^\d.]", "", text)
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _parse_bedrooms(text: str):
    match = re.search(r"(\d+)\s*bed", text, re.I)
    return int(match.group(1)) if match else None


def _parse_card(card, listing_type: str, source: str) -> dict | None:
    """Extract fields from a single Foxtons property card."""
    try:
        # Title / address
        title_el = card.query_selector("span[itemprop='streetAddress'], .propertyTitle, h2.propertyAddress")
        title = title_el.inner_text().strip() if title_el else ""

        # Price
        price_el = card.query_selector(".price, [class*='price']")
        price = _parse_price(price_el.inner_text()) if price_el else None

        # Bedrooms
        bed_el = card.query_selector("[class*='bedroom'], [class*='bed']")
        bed_text = bed_el.inner_text() if bed_el else ""
        bedrooms = _parse_bedrooms(bed_text + " " + title)

        # Property type
        type_el = card.query_selector("[class*='propType'], [class*='type']")
        type_text = type_el.inner_text() if type_el else ""
        type_match = re.search(
            r"(flat|apartment|house|terraced|detached|semi|studio|bungalow)",
            type_text + " " + title, re.I
        )
        prop_type = type_match.group(1).lower() if type_match else None

        # URL
        link_el = card.query_selector("a[href]")
        href = link_el.get_attribute("href") if link_el else ""
        url_full = BASE_URL + href if href and href.startswith("/") else href

        # Postcode from title
        postcode_area = _postcode_area(title)

        return {
            "source": source,
            "listing_type": listing_type,
            "title": title,
            "price": price,
            "postcode": "",
            "postcode_area": postcode_area,
            "lat": None,
            "lng": None,
            "bedrooms": bedrooms,
            "property_type": prop_type,
            "url": url_full,
        }
    except Exception:
        return None


class FoxtonsScraper(BaseScraper):
    SOURCE_NAME = "foxtons"

    def scrape(self) -> list[dict]:
        results = []

        with sync_playwright() as pw:
            browser = pw.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            context = browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/124.0.0.0 Safari/537.36"
                )
            )

            for cfg in SEARCH_CONFIGS:
                listing_type = cfg["listing_type"]
                page_num = 1

                while page_num <= self.max_pages:
                    url = cfg["url_template"].format(page=page_num)
                    page = context.new_page()

                    try:
                        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
                        # Wait for property cards to render
                        page.wait_for_selector(
                            "[class*='propertyCard'], [class*='property-card'], article",
                            timeout=15_000
                        )
                    except PWTimeout:
                        self.logger.info(f"[{listing_type}] Timeout on page {page_num} — stopping")
                        page.close()
                        break

                    cards = page.query_selector_all(
                        "[class*='propertyCard'], [class*='property-card'], "
                        "li[class*='property'], article[class*='property']"
                    )

                    if not cards:
                        self.logger.info(f"[{listing_type}] No cards on page {page_num} — stopping")
                        page.close()
                        break

                    for card in cards:
                        row = _parse_card(card, listing_type, self.SOURCE_NAME)
                        if row:
                            results.append(row)

                    self.log_page(page_num, len(results))
                    page.close()
                    page_num += 1
                    self.wait()

            browser.close()

        return results


if __name__ == "__main__":
    scraper = FoxtonsScraper()
    scraper.run()
