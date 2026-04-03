# London Property & Crime Intelligence System — Plan

## Architecture Overview

- **Data Sources**: 
  - Crime: UK Police bulk CSV (Metropolitan + City of London)
  - Properties (Sale): Land Registry Price Paid CSV + OnTheMarket + Foxtons
  - Properties (Rent): OpenRent + Gumtree
- **Scrapers**: Playwright (JS-heavy) + requests/BeautifulSoup (static pages)
- **Processing**: Python pipeline in Docker
- **Storage**: AWS S3 (raw + processed, optional) + Railway PostgreSQL (structured)
- **Dashboard**: Streamlit + Folium map
- **Orchestration**: Docker Compose (separate container per service)

---

## Services (Docker Compose)

| Container     | Role                                          |
|---------------|-----------------------------------------------|
| `scraper`     | Playwright + BS4 — all property scrapers      |
| `pipeline`    | Python — clean, merge, score, upload to S3    |
| `dashboard`   | Streamlit — interactive London map            |

> DB is hosted on Railway (no local db container needed)

---

## Phase 1 — Foundation ✅ COMPLETE

### Infrastructure ✅
- [x] Create `docker-compose.yml` with: scraper, pipeline, dashboard
- [x] Create `scrapers/Dockerfile` (Python + Playwright + system deps for ARM64)
- [x] Create `scripts/Dockerfile` (Python pipeline)
- [x] Create `dashboard/Dockerfile` (Streamlit)
- [x] Create `.env.example` (Railway DB URL, AWS S3 optional)
- [x] Create `config.py` — central config loaded from env vars
- [x] Switch DB from local Postgres → Railway hosted PostgreSQL
- [x] Pipeline waits for scraper via `depends_on: service_completed_successfully`

### Database ✅
- [x] Write `database/schema.sql` (properties, crime, merged_data + indexes)
- [x] Schema initialised on Railway via `db-init` profile

### Scrapers ✅
- [x] `scrapers/base_scraper.py` — abstract base (rate limiting, CSV save, S3 upload, `execute_values` bulk insert)
- [x] `scrapers/openrent.py` — 200 rental listings/run (selectors updated after site redesign)
- [x] `scrapers/gumtree.py` — JSON-LD parser (CSS-in-JS classes bypassed) — 0 results (JS-rendered, needs Playwright Phase 2)
- [x] `scrapers/onthemarket.py` — Playwright, `--no-sandbox` added — timing out in Docker (Phase 2 fix)
- [x] `scrapers/foxtons.py` — Playwright, `--no-sandbox` added — timing out in Docker (Phase 2 fix)
- [x] `scrapers/land_registry.py` — 6,848 London-only sales (regex postcode filter fixed)
- [x] `scrapers/run_all.py` — orchestrator

### Crime Extraction ✅
- [x] `scripts/extract_crime.py` — switched from broken API polygon endpoint → bulk ZIP download (272,729 crimes/run)

### Data Cleaning ✅
- [x] `scripts/clean_properties.py` — price validation, postcode standardisation (SQLAlchemy fixed)
- [x] `scripts/clean_crime.py` — London bbox filter, postcode_area centroid enrichment (SQLAlchemy fixed)

### Merging & Scoring ✅
- [x] `scripts/merge_data.py` — aggregate by postcode_area, join crime + property
- [x] `scripts/scoring.py` — min-max normalise, investment_score (empty data guard added)

### S3 Integration ✅
- [x] S3 upload in base_scraper and scoring — skipped gracefully if credentials not set

### Dashboard ✅
- [x] `dashboard/app.py` — Streamlit + Folium map, crime heatmap, filters, charts, top areas table

---

## Live Data (as of 2026-04-03)

| Source | Records |
|---|---|
| OpenRent (rent) | 200 |
| Land Registry (sale) | 6,848 |
| Crime (Met + City of London, 3 months) | 272,729 |
| Clean properties | 42,158 |
| Postcode areas scored | 276 |

---

## Known Issues / Phase 2 Backlog

- [ ] **Playwright scrapers timing out in Docker** (OnTheMarket, Foxtons) — ARM64 + headless Chromium networking issue; investigate `--disable-gpu` or switch to `requests-html`
- [ ] **Gumtree returns 0** — page is fully JS-rendered; needs Playwright scraper
- [ ] **Rent data missing from scoring** — only OpenRent contributing; rent prices not populating `avg_rent_price` for most areas yet
- [ ] Match crime to property using lat/lng proximity (haversine, 500m radius)
- [ ] Add 2nd agent scraper (e.g. Purplebricks) using base class
- [ ] Crime trend analysis (month-over-month change)
- [ ] Postcode → lat/lng enrichment via postcodes.io API

---

## Phase 3 — Automation & Advanced Viz
- [ ] Cron job inside Docker to re-scrape weekly
- [ ] Add Metabase or Power BI dashboard alternative
- [ ] SQL views for borough-level aggregations

---

## Phase 4 — ML
- [ ] Model to predict "future safe areas"
- [ ] Investment recommendation engine

---

## Review — Phase 1 Complete (2026-04-03)

### Bugs Fixed During Testing
| Bug | Fix |
|---|---|
| OpenRent 0 results | Updated selector `a.pli.clearfix` → `a.pli.search-property-card` after site redesign |
| Gumtree 0 results | Rewrote to parse JSON-LD instead of CSS-in-JS class names |
| Playwright won't launch in Docker | Added `--no-sandbox --disable-dev-shm-usage` args |
| Land Registry pulling non-London postcodes | Replaced `startswith("N")` with regex `N\d` to exclude NE/NP/NG etc. |
| Land Registry insert took 7+ minutes | Replaced `executemany` with `execute_values` (page_size=500) |
| UK Police API 503 | Switched to bulk ZIP download — one file contains all months |
| Police ZIP 0 crimes | Force name mismatch: fixed `metropolitan-police-service` → `metropolitan` |
| Pipeline runs before scraper finishes | Added `depends_on: service_completed_successfully` |
| `pd.read_sql` UserWarning | Replaced `psycopg2.connect()` with SQLAlchemy `create_engine` |
| `scoring.py` crash on empty data | Added empty DataFrame guard before MinMaxScaler |
| `version` attribute warning in compose | Removed obsolete `version: "3.9"` field |
