"""
Orchestrates all scrapers in sequence.
Run via: docker compose run scraper
"""

import logging
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from openrent import OpenRentScraper
from gumtree import GumtreeScraper
from onthemarket import OnTheMarketScraper
from foxtons import FoxtonsScraper
from land_registry import LandRegistryScraper

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("run_all")

# Add new agent scrapers here — no other changes needed
SCRAPERS = [
    OpenRentScraper,
    GumtreeScraper,
    OnTheMarketScraper,
    FoxtonsScraper,
    LandRegistryScraper,
]


def main():
    total = 0
    for ScraperClass in SCRAPERS:
        try:
            scraper = ScraperClass()
            rows = scraper.run()
            total += len(rows)
        except Exception as e:
            logger.error(f"{ScraperClass.__name__} failed: {e}", exc_info=True)

    logger.info(f"All scrapers done. Total listings collected: {total}")


if __name__ == "__main__":
    main()
