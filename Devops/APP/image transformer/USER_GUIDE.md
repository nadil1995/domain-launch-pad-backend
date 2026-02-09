# ImageForge User Guide

This guide walks you through using the ImageForge platform — from signing up to converting images via the API and web dashboard.

## Getting Started

### 1. Create an Account

Visit the app at `http://localhost:3000` (or your deployed URL) and click **Get Started** or navigate to `/signup`.

Enter your email, password, and optional name. Once signed up you'll be logged in and redirected to the dashboard.

### 2. Get Your API Key

Navigate to **Dashboard > API Keys** and click **Create Key**.

- Give your key a descriptive name (e.g. "Production Server", "Testing").
- The full API key (starting with `imgf_...`) is shown **only once** — copy it immediately.
- The dashboard shows a truncated prefix for identification, but the full key cannot be retrieved later.
- You can create multiple keys for different applications or environments.
- Revoke a key at any time by clicking the revoke button — it takes effect immediately.

### 3. Convert Your First Image

You can convert images through the **Playground** in the dashboard or via the API directly.

## Using the Dashboard

### Playground

The Playground is a visual converter for testing:

1. Go to **Dashboard > Playground**
2. Paste your API key in the key field
3. Click the upload area and select an image (PNG, JPG, WEBP, HEIC, SVG, PDF, or RAW)
4. Choose an output format (WEBP, PNG, JPG, or SVG)
5. Adjust the quality slider (1–100)
6. Click **Convert**
7. Preview the result and download it

### Usage Stats

The **Usage** page shows:

- **Quota card** — Your current month's usage vs. your plan limit (100/month on Free)
- **Summary stats** — Total conversions, data processed, average speed
- **By format** — Breakdown of conversions per output format
- **Daily activity** — Day-by-day conversion counts

### API Keys

The **API Keys** page lets you:

- **Create** new keys with a name
- **View** existing keys (prefix only, e.g. `imgf_abc1234...`)
- **Copy** the prefix for reference
- **Revoke** keys you no longer need

## Using the API

All API endpoints are under `/api/v1`. The full interactive documentation is available at `/api/docs` (Swagger UI).

### Authentication

**Dashboard endpoints** (signup, login, keys, usage) use JWT tokens:

```
Authorization: Bearer eyJhbGciOiJIUzI1...
```

**Conversion endpoints** (convert, batch, jobs) use API keys:

```
x-api-key: imgf_abc123def456...
```

### Single Image Conversion

Convert one image synchronously — the response is the converted file.

```bash
curl -X POST http://localhost:4000/api/v1/convert \
  -H "x-api-key: YOUR_API_KEY" \
  -F "file=@photo.jpg" \
  -F "outputFormat=webp" \
  -F "quality=85" \
  -o converted.webp
```

**Parameters** (multipart form data):

| Field | Required | Description |
|---|---|---|
| `file` | Yes | The image file to convert |
| `outputFormat` | Yes | Target format: `png`, `jpg`, `webp`, or `svg` |
| `quality` | No | 1–100 (default: 80 for webp, 85 for jpg) |
| `width` | No | Resize to this width in pixels |
| `height` | No | Resize to this height in pixels |
| `fit` | No | Resize mode: `cover`, `contain`, `fill`, `inside` (default), `outside` |
| `dpi` | No | PDF rasterization DPI (default: 150) |
| `page` | No | PDF page number, 1-indexed (default: 1) |
| `lossless` | No | `true` for lossless WEBP compression |

**Response**: The converted image binary with headers:
- `Content-Type`: `image/webp`, `image/png`, `image/jpeg`, or `image/svg+xml`
- `X-Image-Width`: Output width in pixels
- `X-Image-Height`: Output height in pixels
- `X-Quota-Remaining`: Remaining conversions this month (Free plan)
- `X-Quota-Limit`: Monthly limit (Free plan)

### Batch Conversion

Convert multiple files asynchronously — results are polled or received via webhook.

```bash
curl -X POST http://localhost:4000/api/v1/convert/batch \
  -H "x-api-key: YOUR_API_KEY" \
  -F "files=@photo1.jpg" \
  -F "files=@photo2.png" \
  -F "files=@photo3.heic" \
  -F "outputFormat=webp" \
  -F "quality=80"
```

**Additional parameter**:

| Field | Required | Description |
|---|---|---|
| `files` | Yes | Up to 20 files |
| `webhookUrl` | No | URL to POST completion events to |

**Response** (HTTP 202 Accepted):

```json
{
  "batchId": "clxyz123...",
  "jobCount": 3,
  "jobs": [
    { "id": "clxyz124...", "status": "PENDING", "originalName": "photo1.jpg" },
    { "id": "clxyz125...", "status": "PENDING", "originalName": "photo2.png" },
    { "id": "clxyz126...", "status": "PENDING", "originalName": "photo3.heic" }
  ]
}
```

### Checking Job Status

Poll individual jobs until they complete:

```bash
curl http://localhost:4000/api/v1/jobs/clxyz124... \
  -H "x-api-key: YOUR_API_KEY"
```

**Response**:

```json
{
  "id": "clxyz124...",
  "status": "COMPLETED",
  "inputFormat": "jpg",
  "outputFormat": "webp",
  "fileSize": 1024000,
  "outputKey": "results/batch-id/job-id.webp",
  "downloadUrl": "https://minio:9000/imageforge/results/...?X-Amz-...",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "startedAt": "2025-01-15T10:30:01.000Z",
  "completedAt": "2025-01-15T10:30:03.000Z"
}
```

The `downloadUrl` is a presigned S3 URL — download the result within **1 hour** before it expires.

**Job statuses**:
- `PENDING` — Queued, waiting for a worker
- `PROCESSING` — Currently being converted
- `COMPLETED` — Done, `downloadUrl` available
- `FAILED` — Conversion failed, check `error` field

### Code Examples

#### Python

```python
import requests

API_KEY = "imgf_your_key_here"
BASE = "http://localhost:4000/api/v1"

# Single conversion
with open("photo.jpg", "rb") as f:
    resp = requests.post(
        f"{BASE}/convert",
        headers={"x-api-key": API_KEY},
        files={"file": f},
        data={"outputFormat": "webp", "quality": "85"},
    )
    with open("output.webp", "wb") as out:
        out.write(resp.content)

print(f"Converted: {resp.headers.get('X-Image-Width')}x{resp.headers.get('X-Image-Height')}")
```

#### Node.js

```javascript
const fs = require("fs");
const FormData = require("form-data");

const API_KEY = "imgf_your_key_here";
const BASE = "http://localhost:4000/api/v1";

async function convert() {
  const form = new FormData();
  form.append("file", fs.createReadStream("photo.jpg"));
  form.append("outputFormat", "webp");
  form.append("quality", "85");

  const res = await fetch(`${BASE}/convert`, {
    method: "POST",
    headers: { "x-api-key": API_KEY },
    body: form,
  });

  const buffer = await res.arrayBuffer();
  fs.writeFileSync("output.webp", Buffer.from(buffer));
  console.log(`Width: ${res.headers.get("X-Image-Width")}`);
}

convert();
```

#### Batch with Polling

```python
import requests
import time

API_KEY = "imgf_your_key_here"
BASE = "http://localhost:4000/api/v1"

# Submit batch
files = [
    ("files", open("img1.jpg", "rb")),
    ("files", open("img2.png", "rb")),
]
resp = requests.post(
    f"{BASE}/convert/batch",
    headers={"x-api-key": API_KEY},
    files=files,
    data={"outputFormat": "webp"},
)
batch = resp.json()

# Poll each job
for job in batch["jobs"]:
    while True:
        status = requests.get(
            f"{BASE}/jobs/{job['id']}",
            headers={"x-api-key": API_KEY},
        ).json()

        if status["status"] == "COMPLETED":
            # Download result (presigned URL valid for 1 hour)
            result = requests.get(status["downloadUrl"])
            with open(f"output_{job['id']}.webp", "wb") as f:
                f.write(result.content)
            print(f"Downloaded {job['originalName']}")
            break
        elif status["status"] == "FAILED":
            print(f"Failed: {status['error']}")
            break

        time.sleep(2)  # Poll every 2 seconds
```

## Supported Formats

### Input Formats

| Format | Extensions | Notes |
|---|---|---|
| JPEG | `.jpg`, `.jpeg` | Most common photo format |
| PNG | `.png` | Lossless with transparency |
| WebP | `.webp` | Modern web format |
| HEIC/HEIF | `.heic`, `.heif` | Apple device photos |
| SVG | `.svg` | Vector graphics |
| TIFF | `.tiff`, `.tif` | High quality raster |
| PDF | `.pdf` | Renders specific page to image |
| RAW | `.cr2`, `.nef`, `.arw`, `.dng` | Camera raw formats |

### Output Formats

| Format | Best For |
|---|---|
| **WEBP** | Web use — 30–80% smaller than JPG/PNG with similar quality |
| **PNG** | Transparency, screenshots, graphics |
| **JPG** | Photos, smaller file size with acceptable quality loss |
| **SVG** | Vector tracing of raster images (line art, logos) |

### Format Compatibility

Not all input-output combinations are supported:

- PDF, RAW, HEIC → PNG, JPG, WEBP (not SVG)
- PNG, JPG → SVG (raster-to-vector tracing)
- SVG → PNG, JPG, WEBP (rasterization)

Attempting an unsupported combination returns HTTP 422.

## Plans & Limits

### Free Plan

- **100 conversions per month** (resets on the 1st)
- All formats and options available
- No credit card required
- Check remaining quota in the Usage dashboard or via `X-Quota-Remaining` response header

### Pay-As-You-Go Plan

- **Unlimited conversions**
- Metered billing via Stripe (per conversion)
- Upgrade available from the dashboard

### Rate Limits

These apply regardless of plan:

| Endpoint | Limit |
|---|---|
| Signup / Login | 10 requests per 15 minutes |
| Conversions | 60 requests per minute |
| All other endpoints | 100 requests per 15 minutes |

When rate limited, the API returns HTTP 429. Wait and retry.

## API Key Best Practices

1. **Never share your key** — Treat it like a password
2. **Use separate keys** for different applications (production, staging, testing)
3. **Revoke compromised keys** immediately from the dashboard
4. **Store keys in environment variables**, not in source code
5. **The full key is shown once** — If lost, revoke the old one and create a new one

## Resize & Quality Tips

### Quality Settings

- **WEBP 70–85**: Good balance of quality and size for web images
- **WEBP 90+**: Near-lossless, larger files
- **JPG 80–90**: Standard photo quality
- **WEBP lossless=true**: Perfect quality, larger than lossy but smaller than PNG

### Resizing

- Set `width` only: Height auto-calculated to maintain aspect ratio
- Set `height` only: Width auto-calculated
- Set both: Image fits within the box according to `fit` mode
- **`inside`** (default): Shrinks to fit within dimensions, never upscales
- **`cover`**: Fills dimensions exactly, may crop edges
- **`contain`**: Fits within dimensions, may add padding
- **`fill`**: Stretches to exact dimensions (distorts aspect ratio)

### PDF Conversion

- Default renders page 1 at 150 DPI
- Use `page=2` for other pages
- Increase `dpi=300` for print-quality output (larger files)
- Decrease `dpi=72` for small thumbnails

## Webhooks (Batch)

For batch conversions, provide a `webhookUrl` to receive a POST when all jobs complete:

```bash
curl -X POST http://localhost:4000/api/v1/convert/batch \
  -H "x-api-key: YOUR_API_KEY" \
  -F "files=@photo.jpg" \
  -F "outputFormat=webp" \
  -F "webhookUrl=https://your-app.com/webhook/imageforge"
```

The webhook payload is a POST request sent to your URL when each job completes or fails.

## Download Expiration

Batch conversion results are stored in S3 and accessed via presigned URLs. These URLs **expire after 1 hour**. If you need the file again after expiry, poll the job status endpoint to get a fresh URL.

## Troubleshooting

| Problem | Solution |
|---|---|
| `401 Unauthorized` | Check your API key is correct and not revoked |
| `413 Payload Too Large` | File exceeds 50 MB limit — compress or resize before uploading |
| `415 Unsupported Media Type` | Input format not recognized — check supported formats list |
| `422 Unprocessable Entity` | This input-output format combination is not supported |
| `429 Too Many Requests` | Rate limited — wait and retry, or check your monthly quota |
| Download URL expired | Poll `/jobs/:id` again to get a fresh presigned URL |
| Batch job stuck in PENDING | Check that the worker service is running |
| CORS error in browser | Use the web frontend (which proxies API requests) instead of calling the API directly from a different origin |

## API Reference

Full interactive API documentation with request/response schemas is available at:

```
http://localhost:4000/api/docs
```

This Swagger UI lets you try endpoints directly from the browser.
