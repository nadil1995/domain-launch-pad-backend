"""
OnTheMarket scraper — London sale + rent.
Uses Playwright (JS-rendered pages).
"""

import re
import json
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
from base_scraper import BaseScraper


BASE_URL = "https://www.onthemarket.com"

SEARCH_CONFIGS = [
    {
        "listing_type": "sale",
        "url_template": (
            "https://www.onthemarket.com/for-sale/property/london/"
            "?page={page}"
        ),
    },
    {
        "listing_type": "rent",
        "url_template": (
            "https://www.onthemarket.com/to-rent/property/london/"
            "?page={page}"
        ),
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


class OnTheMarketScraper(BaseScraper):
    SOURCE_NAME = "onthemarket"

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
                        page.wait_for_selector("li.otm-PropertyCard", timeout=15_000)
                    except PWTimeout:
                        self.logger.info(f"[{listing_type}] Timeout on page {page_num} — stopping")
                        page.close()
                        break

                    cards = page.query_selector_all("li.otm-PropertyCard")
                    if not cards:
                        page.close()
                        break

                    for card in cards:
                        try:
                            title_el = card.query_selector("a.otm-PropertyCardInfo__address")
                            title = title_el.inner_text().strip() if title_el else ""

                            price_el = card.query_selector(".otm-PropertyCardPricing__price")
                            price = _parse_price(price_el.inner_text()) if price_el else None

                            detail_el = card.query_selector(".otm-PropertyCardInfo__summary")
                            detail_text = detail_el.inner_text() if detail_el else ""
                            bedrooms = _parse_bedrooms(detail_text)

                            type_match = re.search(
                                r"(flat|apartment|house|terraced|detached|semi|studio|bungalow)",
                                detail_text, re.I
                            )
                            prop_type = type_match.group(1).lower() if type_match else None

                            href = title_el.get_attribute("href") if title_el else ""
                            url_full = BASE_URL + href if href and href.startswith("/") else href

                            results.append({
                                "source": self.SOURCE_NAME,
                                "listing_type": listing_type,
                                "title": title,
                                "price": price,
                                "postcode": "",
                                "postcode_area": _postcode_area(title),
                                "lat": None,
                                "lng": None,
                                "bedrooms": bedrooms,
                                "property_type": prop_type,
                                "url": url_full,
                            })
                        except Exception as e:
                            self.logger.warning(f"Card parse error: {e}")

                    self.log_page(page_num, len(results))
                    page.close()
                    page_num += 1
                    self.wait()

            browser.close()

        return results


if __name__ == "__main__":
    scraper = OnTheMarketScraper()
    scraper.run()
