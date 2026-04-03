-- London Property & Crime Intelligence System
-- Schema

CREATE TABLE IF NOT EXISTS properties (
    id              SERIAL PRIMARY KEY,
    source          VARCHAR(50) NOT NULL,          -- openrent, gumtree, onthemarket, foxtons, land_registry
    listing_type    VARCHAR(10) NOT NULL,           -- sale | rent
    title           TEXT,
    price           NUMERIC(12, 2),
    postcode        VARCHAR(10),
    postcode_area   VARCHAR(5),                    -- e.g. SW1, CR0
    lat             DOUBLE PRECISION,
    lng             DOUBLE PRECISION,
    bedrooms        SMALLINT,
    property_type   VARCHAR(50),                   -- flat, terraced, detached, etc.
    url             TEXT,
    scraped_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crime (
    id              SERIAL PRIMARY KEY,
    crime_type      VARCHAR(100),
    lat             DOUBLE PRECISION NOT NULL,
    lng             DOUBLE PRECISION NOT NULL,
    postcode_area   VARCHAR(5),
    month           VARCHAR(7),                    -- YYYY-MM
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merged_data (
    postcode_area       VARCHAR(5) PRIMARY KEY,
    avg_sale_price      NUMERIC(12, 2),
    avg_rent_price      NUMERIC(12, 2),
    crime_count         INTEGER,
    investment_score    NUMERIC(5, 4),             -- 0.0000 to 1.0000
    updated_at          TIMESTAMP DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_properties_postcode_area ON properties(postcode_area);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type  ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_source        ON properties(source);
CREATE INDEX IF NOT EXISTS idx_crime_postcode_area      ON crime(postcode_area);
CREATE INDEX IF NOT EXISTS idx_crime_lat_lng            ON crime(lat, lng);
