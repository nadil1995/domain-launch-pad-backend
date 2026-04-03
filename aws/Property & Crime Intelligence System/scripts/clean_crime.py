"""
Cleans crime data.
Reads from DB, filters to London bbox, enriches postcode_area via reverse geocoding grid.
Writes cleaned CSV to data/processed/.
"""

import os
import sys
import logging
import pandas as pd
from sqlalchemy import create_engine

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s: %(message)s")
logger = logging.getLogger("clean_crime")


# Broad postcode area lookup using lat/lng centroids
# Used to assign postcode_area without a full geocoding API
AREA_CENTROIDS = {
    "SW1": (51.4975, -0.1357), "SW2": (51.4557, -0.1199), "SW3": (51.4876, -0.1698),
    "SW4": (51.4626, -0.1442), "SW5": (51.4910, -0.1936), "SW6": (51.4742, -0.2014),
    "SW7": (51.4946, -0.1759), "SW8": (51.4762, -0.1226), "SW9": (51.4636, -0.1165),
    "SW10": (51.4825, -0.1870), "SW11": (51.4651, -0.1706), "SW12": (51.4489, -0.1579),
    "SW13": (51.4741, -0.2495), "SW14": (51.4609, -0.2684), "SW15": (51.4600, -0.2213),
    "SW16": (51.4187, -0.1317), "SW17": (51.4288, -0.1622), "SW18": (51.4558, -0.1900),
    "SW19": (51.4199, -0.1976), "SW20": (51.4094, -0.2146),
    "SE1": (51.5004, -0.0877), "SE2": (51.4898, 0.1187), "SE3": (51.4669, -0.0022),
    "SE4": (51.4612, -0.0355), "SE5": (51.4712, -0.0839), "SE6": (51.4392, -0.0237),
    "SE7": (51.4859, 0.0416), "SE8": (51.4793, -0.0374), "SE9": (51.4469, 0.0606),
    "SE10": (51.4826, -0.0097), "SE11": (51.4880, -0.1093), "SE12": (51.4440, 0.0129),
    "SE13": (51.4555, -0.0188), "SE14": (51.4730, -0.0419), "SE15": (51.4722, -0.0641),
    "SE16": (51.4965, -0.0510), "SE17": (51.4857, -0.0924), "SE18": (51.4849, 0.0750),
    "SE19": (51.4152, -0.0838), "SE20": (51.4112, -0.0538), "SE21": (51.4446, -0.0856),
    "SE22": (51.4521, -0.0650), "SE23": (51.4391, -0.0459), "SE24": (51.4556, -0.1039),
    "SE25": (51.3983, -0.0640), "SE26": (51.4266, -0.0446), "SE27": (51.4304, -0.1037),
    "SE28": (51.5035, 0.1167),
    "E1": (51.5155, -0.0596), "E2": (51.5274, -0.0564), "E3": (51.5292, -0.0179),
    "E4": (51.6228, -0.0080), "E5": (51.5578, -0.0522), "E6": (51.5285, 0.0585),
    "E7": (51.5509, 0.0340), "E8": (51.5443, -0.0571), "E9": (51.5398, -0.0349),
    "E10": (51.5686, -0.0148), "E11": (51.5686, 0.0070), "E12": (51.5490, 0.0567),
    "E13": (51.5196, 0.0242), "E14": (51.5085, -0.0175), "E15": (51.5466, 0.0018),
    "E16": (51.5083, 0.0299), "E17": (51.5863, -0.0201), "E18": (51.5928, 0.0262),
    "N1": (51.5373, -0.1020), "N2": (51.5882, -0.1700), "N3": (51.5990, -0.1940),
    "N4": (51.5693, -0.1003), "N5": (51.5570, -0.1031), "N6": (51.5745, -0.1491),
    "N7": (51.5550, -0.1245), "N8": (51.5885, -0.1237), "N9": (51.6278, -0.0756),
    "N10": (51.5958, -0.1428), "N11": (51.6124, -0.1571), "N12": (51.6157, -0.1770),
    "N13": (51.6170, -0.1054), "N14": (51.6368, -0.1163), "N15": (51.5847, -0.0784),
    "N16": (51.5634, -0.0813), "N17": (51.6002, -0.0685), "N18": (51.6124, -0.0746),
    "N19": (51.5654, -0.1334), "N20": (51.6303, -0.1683), "N21": (51.6464, -0.1041),
    "N22": (51.6039, -0.1161),
    "NW1": (51.5338, -0.1456), "NW2": (51.5574, -0.2175), "NW3": (51.5562, -0.1751),
    "NW4": (51.5953, -0.2100), "NW5": (51.5521, -0.1419), "NW6": (51.5506, -0.1973),
    "NW7": (51.6185, -0.2326), "NW8": (51.5290, -0.1738), "NW9": (51.5877, -0.2481),
    "NW10": (51.5402, -0.2644), "NW11": (51.5771, -0.1999),
    "W1": (51.5137, -0.1518), "W2": (51.5147, -0.1845), "W3": (51.5116, -0.2636),
    "W4": (51.4924, -0.2547), "W5": (51.5116, -0.3011), "W6": (51.4919, -0.2233),
    "W7": (51.5073, -0.3286), "W8": (51.5018, -0.1971), "W9": (51.5227, -0.1938),
    "W10": (51.5205, -0.2139), "W11": (51.5071, -0.2055), "W12": (51.5042, -0.2266),
    "W13": (51.5107, -0.3234), "W14": (51.4964, -0.2086),
    "WC1": (51.5222, -0.1230), "WC2": (51.5126, -0.1221),
    "EC1": (51.5234, -0.1027), "EC2": (51.5187, -0.0881), "EC3": (51.5126, -0.0820),
    "EC4": (51.5136, -0.1008),
    "CR0": (51.3762, -0.0982), "CR2": (51.3430, -0.0859), "CR4": (51.4023, -0.1815),
    "CR5": (51.3217, -0.1397), "CR6": (51.3091, -0.0617), "CR7": (51.3948, -0.1025),
    "CR8": (51.3382, -0.1090),
    "BR1": (51.4098, -0.0132), "BR2": (51.3842, -0.0176), "BR3": (51.3907, -0.0182),
    "BR4": (51.3755, -0.0286), "BR5": (51.3932, 0.0755), "BR6": (51.3717, 0.0576),
    "BR7": (51.4249, 0.0543), "BR8": (51.3950, 0.1650),
    "KT1": (51.4104, -0.2994), "KT2": (51.4156, -0.3038), "KT3": (51.3967, -0.2562),
    "KT4": (51.3777, -0.2272), "KT5": (51.3834, -0.2801), "KT6": (51.3725, -0.2984),
    "RM1": (51.5756, 0.1830), "RM2": (51.5781, 0.2124), "RM3": (51.5858, 0.2414),
    "RM4": (51.6490, 0.1726), "RM5": (51.5756, 0.1634), "RM6": (51.5714, 0.1282),
    "RM7": (51.5630, 0.1647), "RM8": (51.5518, 0.1439), "RM9": (51.5408, 0.1262),
    "RM10": (51.5368, 0.1622), "RM11": (51.5694, 0.2133), "RM12": (51.5582, 0.2135),
    "RM13": (51.5210, 0.1968), "RM14": (51.5595, 0.2699),
    "WD17": (51.6580, -0.3961), "WD18": (51.6497, -0.4100), "WD19": (51.6337, -0.4001),
    "WD23": (51.6558, -0.3272), "WD24": (51.6657, -0.3932), "WD25": (51.6900, -0.3812),
}


def nearest_postcode_area(lat: float, lng: float) -> str:
    """Find the nearest postcode area centroid."""
    best, best_dist = "", float("inf")
    for area, (clat, clng) in AREA_CENTROIDS.items():
        dist = (lat - clat) ** 2 + (lng - clng) ** 2
        if dist < best_dist:
            best_dist = dist
            best = area
    return best


def load_from_db() -> pd.DataFrame:
    engine = create_engine(config.DATABASE_URL)
    with engine.connect() as conn:
        df = pd.read_sql("SELECT * FROM crime", conn)
    logger.info(f"Loaded {len(df)} crime rows from DB")
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    # Drop null lat/lng
    before = len(df)
    df = df.dropna(subset=["lat", "lng"])
    logger.info(f"Dropped {before - len(df)} rows with null location")

    # Filter to London bounding box
    bb = config.LONDON_BBOX
    df = df[
        df["lat"].between(bb["lat_min"], bb["lat_max"]) &
        df["lng"].between(bb["lon_min"], bb["lon_max"])
    ].copy()
    logger.info(f"After London bbox filter: {len(df)} rows")

    # Enrich postcode_area where missing
    missing_mask = df["postcode_area"].isna() | (df["postcode_area"] == "")
    logger.info(f"Enriching {missing_mask.sum()} rows with postcode_area via centroid lookup")
    df.loc[missing_mask, "postcode_area"] = df[missing_mask].apply(
        lambda r: nearest_postcode_area(r["lat"], r["lng"]), axis=1
    )

    # Standardise crime_type
    df["crime_type"] = df["crime_type"].fillna("unknown").str.lower().str.replace("-", " ")

    df = df.reset_index(drop=True)
    logger.info(f"Clean crime dataset: {len(df)} rows")
    return df


def save(df: pd.DataFrame):
    os.makedirs(config.PROCESSED_DIR, exist_ok=True)
    path = os.path.join(config.PROCESSED_DIR, "crime_clean.csv")
    df.to_csv(path, index=False)
    logger.info(f"Saved → {path}")
    return path


def main():
    df = load_from_db()
    df = clean(df)
    save(df)


if __name__ == "__main__":
    main()
