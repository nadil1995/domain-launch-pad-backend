import os
from dotenv import load_dotenv

load_dotenv()

# Database
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://pci_user:changeme@db:5432/pci_db")

# AWS S3 (optional)
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION", "eu-west-2")
S3_BUCKET = os.getenv("S3_BUCKET")
S3_ENABLED = bool(S3_BUCKET and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY)

# Scraper
SCRAPER_DELAY = float(os.getenv("SCRAPER_DELAY_SECONDS", 1.5))
SCRAPER_MAX_PAGES = int(os.getenv("SCRAPER_MAX_PAGES", 10))

# London bounding box
LONDON_BBOX = {
    "lat_min": 51.3,
    "lat_max": 51.7,
    "lon_min": -0.5,
    "lon_max": 0.3,
}

# Target areas
TARGET_AREAS = [
    "London",
    "Croydon",
    "Bromley",
    "Watford",
    "Romford",
    "Kingston upon Thames",
]

# Local data paths
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
RAW_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
