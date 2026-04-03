FROM python:3.11-slim

WORKDIR /app

# Install Chromium system dependencies manually
# (avoids --with-deps which fails on ARM64 / Debian trixie due to renamed font packages)
RUN apt-get update && apt-get install -y \
    wget curl gnupg \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 \
    libxfixes3 libxrandr2 libgbm1 libasound2 \
    libpango-1.0-0 libcairo2 \
    fonts-liberation fonts-unifont \
    && rm -rf /var/lib/apt/lists/*

COPY scrapers/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install browser only (deps already handled above)
RUN playwright install chromium

COPY . .
