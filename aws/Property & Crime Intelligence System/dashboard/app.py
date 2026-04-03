"""
London Property & Crime Intelligence Dashboard
Streamlit + Folium interactive map
"""

import os
import sys
import pandas as pd
import streamlit as st
import folium
from folium.plugins import HeatMap
from streamlit_folium import st_folium
import plotly.express as px
from sqlalchemy import create_engine

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
import config

st.set_page_config(
    page_title="London Property & Crime Intelligence",
    page_icon="🏙️",
    layout="wide",
)

# ------------------------------------------------------------------
# Data loading
# ------------------------------------------------------------------

def _engine():
    return create_engine(config.DATABASE_URL)


@st.cache_data(ttl=600)
def load_merged() -> pd.DataFrame:
    try:
        with _engine().connect() as conn:
            return pd.read_sql("SELECT * FROM merged_data ORDER BY investment_score DESC", conn)
    except Exception:
        path = os.path.join(config.PROCESSED_DIR, "merged_data.csv")
        if os.path.exists(path):
            return pd.read_csv(path)
        return pd.DataFrame()


@st.cache_data(ttl=600)
def load_crime() -> pd.DataFrame:
    try:
        with _engine().connect() as conn:
            return pd.read_sql("SELECT lat, lng, crime_type, postcode_area FROM crime LIMIT 50000", conn)
    except Exception:
        path = os.path.join(config.PROCESSED_DIR, "crime_clean.csv")
        if os.path.exists(path):
            return pd.read_csv(path)
        return pd.DataFrame()


@st.cache_data(ttl=600)
def load_properties() -> pd.DataFrame:
    try:
        with _engine().connect() as conn:
            df = pd.read_sql(
                "SELECT title, price, postcode_area, listing_type, property_type, bedrooms, source, url "
                "FROM properties WHERE lat IS NOT NULL LIMIT 5000",
                conn
            )
        return df
    except Exception:
        path = os.path.join(config.PROCESSED_DIR, "properties_clean.csv")
        if os.path.exists(path):
            return pd.read_csv(path)
        return pd.DataFrame()


# Approximate centroid for each postcode area (used for map markers)
AREA_CENTROIDS = {
    "SW1": (51.4975, -0.1357), "SW2": (51.4557, -0.1199), "SW3": (51.4876, -0.1698),
    "SW4": (51.4626, -0.1442), "SW6": (51.4742, -0.2014), "SW7": (51.4946, -0.1759),
    "SW8": (51.4762, -0.1226), "SW9": (51.4636, -0.1165), "SW10": (51.4825, -0.1870),
    "SW11": (51.4651, -0.1706), "SW12": (51.4489, -0.1579), "SW15": (51.4600, -0.2213),
    "SW16": (51.4187, -0.1317), "SW17": (51.4288, -0.1622), "SW18": (51.4558, -0.1900),
    "SW19": (51.4199, -0.1976), "SW20": (51.4094, -0.2146),
    "SE1": (51.5004, -0.0877), "SE5": (51.4712, -0.0839), "SE6": (51.4392, -0.0237),
    "SE10": (51.4826, -0.0097), "SE11": (51.4880, -0.1093), "SE15": (51.4722, -0.0641),
    "SE16": (51.4965, -0.0510), "SE17": (51.4857, -0.0924), "SE22": (51.4521, -0.0650),
    "SE24": (51.4556, -0.1039),
    "E1": (51.5155, -0.0596), "E2": (51.5274, -0.0564), "E3": (51.5292, -0.0179),
    "E5": (51.5578, -0.0522), "E8": (51.5443, -0.0571), "E14": (51.5085, -0.0175),
    "E15": (51.5466, 0.0018), "E17": (51.5863, -0.0201),
    "N1": (51.5373, -0.1020), "N4": (51.5693, -0.1003), "N5": (51.5570, -0.1031),
    "N7": (51.5550, -0.1245), "N8": (51.5885, -0.1237), "N16": (51.5634, -0.0813),
    "NW1": (51.5338, -0.1456), "NW3": (51.5562, -0.1751), "NW5": (51.5521, -0.1419),
    "NW6": (51.5506, -0.1973), "NW10": (51.5402, -0.2644),
    "W1": (51.5137, -0.1518), "W6": (51.4919, -0.2233), "W8": (51.5018, -0.1971),
    "W11": (51.5071, -0.2055), "W12": (51.5042, -0.2266),
    "WC1": (51.5222, -0.1230), "WC2": (51.5126, -0.1221),
    "EC1": (51.5234, -0.1027), "EC2": (51.5187, -0.0881),
    "CR0": (51.3762, -0.0982), "CR4": (51.4023, -0.1815), "CR7": (51.3948, -0.1025),
    "BR1": (51.4098, -0.0132), "BR2": (51.3842, -0.0176), "BR3": (51.3907, -0.0182),
    "KT1": (51.4104, -0.2994), "KT2": (51.4156, -0.3038), "KT3": (51.3967, -0.2562),
    "RM1": (51.5756, 0.1830), "RM7": (51.5630, 0.1647),
    "WD17": (51.6580, -0.3961), "WD23": (51.6558, -0.3272),
}


def score_color(score: float) -> str:
    """Map investment score to a hex colour (red → amber → green)."""
    if score >= 0.7:
        return "#2ecc71"
    if score >= 0.5:
        return "#f39c12"
    return "#e74c3c"


# ------------------------------------------------------------------
# UI
# ------------------------------------------------------------------

st.title("🏙️ London Property & Crime Intelligence")
st.markdown("Explore investment opportunities across London and surrounding areas.")

merged = load_merged()
crime_df = load_crime()
props_df = load_properties()

if merged.empty:
    st.warning("No data loaded yet. Run the scraper and pipeline containers first.")
    st.stop()

# ------------------------------------------------------------------
# Sidebar filters
# ------------------------------------------------------------------

st.sidebar.header("Filters")

all_areas = sorted(merged["postcode_area"].dropna().unique().tolist())
selected_areas = st.sidebar.multiselect("Postcode Areas", all_areas, default=all_areas[:20])

listing_type = st.sidebar.radio("Listing Type", ["Both", "Sale", "Rent"])

price_col = "avg_sale_price" if listing_type == "Sale" else "avg_rent_price"
if listing_type == "Both":
    max_price = int(merged[["avg_sale_price", "avg_rent_price"]].max().max())
else:
    max_price = int(merged[price_col].max()) if price_col in merged.columns else 1_000_000

price_range = st.sidebar.slider(
    "Max Price (£)", 0, max(max_price, 1), max(max_price, 1), step=1000
)

crime_max = int(merged["crime_count"].max()) if "crime_count" in merged.columns else 100
crime_threshold = st.sidebar.slider("Max Crime Count", 0, max(crime_max, 1), max(crime_max, 1))

score_min = st.sidebar.slider("Min Investment Score", 0.0, 1.0, 0.0, step=0.05)

# ------------------------------------------------------------------
# Apply filters
# ------------------------------------------------------------------

filtered = merged.copy()
if selected_areas:
    filtered = filtered[filtered["postcode_area"].isin(selected_areas)]
if listing_type != "Both" and price_col in filtered.columns:
    filtered = filtered[filtered[price_col] <= price_range]
filtered = filtered[filtered["crime_count"] <= crime_threshold]
filtered = filtered[filtered["investment_score"] >= score_min]

# ------------------------------------------------------------------
# Summary stats
# ------------------------------------------------------------------

col1, col2, col3, col4 = st.columns(4)
col1.metric("Areas Shown", len(filtered))
col2.metric("Avg Sale Price", f"£{filtered['avg_sale_price'].mean():,.0f}" if not filtered.empty else "—")
col3.metric("Avg Rent/mo", f"£{filtered['avg_rent_price'].mean():,.0f}" if not filtered.empty else "—")
col4.metric("Avg Investment Score", f"{filtered['investment_score'].mean():.2f}" if not filtered.empty else "—")

st.markdown("---")

# ------------------------------------------------------------------
# Map
# ------------------------------------------------------------------

map_col, table_col = st.columns([2, 1])

with map_col:
    st.subheader("Interactive Map")
    m = folium.Map(location=[51.505, -0.09], zoom_start=11, tiles="CartoDB positron")

    # Crime heatmap layer
    if not crime_df.empty:
        heat_data = crime_df[["lat", "lng"]].dropna().values.tolist()
        HeatMap(heat_data, radius=8, blur=12, max_zoom=13, name="Crime Heatmap").add_to(m)

    # Investment score markers per postcode area
    for _, row in filtered.iterrows():
        area = row["postcode_area"]
        coords = AREA_CENTROIDS.get(area)
        if not coords:
            continue

        color = score_color(row["investment_score"])
        popup_html = f"""
            <b>{area}</b><br>
            Score: <b>{row['investment_score']:.2f}</b><br>
            Avg Sale: £{row['avg_sale_price']:,.0f}<br>
            Avg Rent: £{row['avg_rent_price']:,.0f}/mo<br>
            Crimes: {int(row['crime_count'])}
        """
        folium.CircleMarker(
            location=coords,
            radius=10,
            color=color,
            fill=True,
            fill_color=color,
            fill_opacity=0.8,
            popup=folium.Popup(popup_html, max_width=200),
            tooltip=f"{area} | Score: {row['investment_score']:.2f}",
        ).add_to(m)

    folium.LayerControl().add_to(m)
    st_folium(m, width=700, height=520)

with table_col:
    st.subheader("Top Investment Areas")
    display_cols = ["postcode_area", "investment_score", "avg_sale_price", "avg_rent_price", "crime_count"]
    display_cols = [c for c in display_cols if c in filtered.columns]
    st.dataframe(
        filtered[display_cols]
        .sort_values("investment_score", ascending=False)
        .head(30)
        .reset_index(drop=True)
        .rename(columns={
            "postcode_area": "Area",
            "investment_score": "Score",
            "avg_sale_price": "Avg Sale (£)",
            "avg_rent_price": "Avg Rent (£/mo)",
            "crime_count": "Crimes",
        }),
        use_container_width=True,
        height=480,
    )

# ------------------------------------------------------------------
# Charts
# ------------------------------------------------------------------

st.markdown("---")
chart_col1, chart_col2 = st.columns(2)

with chart_col1:
    st.subheader("Investment Score by Area")
    top20 = filtered.nlargest(20, "investment_score")
    fig = px.bar(
        top20,
        x="postcode_area",
        y="investment_score",
        color="investment_score",
        color_continuous_scale="RdYlGn",
        labels={"postcode_area": "Area", "investment_score": "Score"},
    )
    fig.update_layout(margin=dict(t=10, b=10), height=320, showlegend=False)
    st.plotly_chart(fig, use_container_width=True)

with chart_col2:
    st.subheader("Price vs Crime Count")
    price_col_plot = "avg_sale_price" if listing_type != "Rent" else "avg_rent_price"
    if price_col_plot in filtered.columns:
        fig2 = px.scatter(
            filtered,
            x="crime_count",
            y=price_col_plot,
            text="postcode_area",
            color="investment_score",
            color_continuous_scale="RdYlGn",
            labels={"crime_count": "Crime Count", price_col_plot: "Avg Price (£)"},
        )
        fig2.update_traces(textposition="top center", textfont_size=9)
        fig2.update_layout(margin=dict(t=10, b=10), height=320)
        st.plotly_chart(fig2, use_container_width=True)

# ------------------------------------------------------------------
# Crime type breakdown
# ------------------------------------------------------------------

if not crime_df.empty and selected_areas:
    st.markdown("---")
    st.subheader("Crime Type Breakdown")
    filtered_crime = crime_df[crime_df["postcode_area"].isin(selected_areas)]
    if not filtered_crime.empty:
        crime_counts = filtered_crime["crime_type"].value_counts().head(10).reset_index()
        crime_counts.columns = ["Crime Type", "Count"]
        fig3 = px.bar(
            crime_counts,
            x="Count",
            y="Crime Type",
            orientation="h",
            color="Count",
            color_continuous_scale="Reds",
        )
        fig3.update_layout(margin=dict(t=10, b=10), height=300, showlegend=False)
        st.plotly_chart(fig3, use_container_width=True)

st.caption("Data sources: OpenRent · Gumtree · OnTheMarket · Foxtons · Land Registry · UK Police API")
