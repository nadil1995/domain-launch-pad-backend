# ImageForge — SaaS Image Conversion API Platform

ImageForge is an industrial-grade image conversion platform offering a pay-as-you-go REST API and a web dashboard. It supports bulk image conversions across multiple formats including PNG, JPG, WEBP, HEIC, SVG, PDF, and RAW camera formats.

## Architecture

```
Frontend (React + Vite + Tailwind)     Backend (Node.js + Express + TypeScript)
├── Landing page                       ├── POST /api/v1/convert       (single file, sync)
├── Login / Signup                     ├── POST /api/v1/convert/batch  (multi-file, async)
├── Dashboard                          ├── GET  /api/v1/jobs/:id       (job status + download)
│   ├── Usage stats                    ├── GET  /api/v1/usage          (usage analytics)
│   ├── API key management             ├── POST /api/v1/auth/signup
│   └── Conversion playground          ├── POST /api/v1/auth/login
└── API docs (Swagger UI)              ├── POST /api/v1/keys           (create API key)
                                       ├── GET  /api/v1/keys           (list keys)
                                       ├── DELETE /api/v1/keys/:id     (revoke key)
                                       ├── GET  /api/v1/health
                                       └── GET  /api/docs              (Swagger UI)

Processing:  Sharp + libvips (JPG/PNG/WEBP/HEIC/SVG/RAW)
             pdfjs-dist + canvas (PDF → image)
             imagetracerjs (raster → SVG tracing)
Queue:       BullMQ + Redis (async batch jobs)
Storage:     S3-compatible / MinIO (uploads + results)
Database:    PostgreSQL + Prisma ORM
Auth:        JWT (dashboard) + API key header (conversions)
Billing:     Stripe metered usage
```

### Monorepo Structure

```
imageforge/
├── packages/
│   ├── api/                          # Backend API + Worker
│   │   ├── src/
│   │   │   ├── app.ts               # Express app (middleware + routes)
│   │   │   ├── index.ts             # Server entrypoint
│   │   │   ├── worker.ts            # BullMQ worker entrypoint
│   │   │   ├── config.ts            # Environment config
│   │   │   ├── middleware/           # auth, rateLimit, quota
│   │   │   ├── routes/              # auth, convert, batch, keys, usage, health, docs
│   │   │   ├── services/
│   │   │   │   ├── auth.ts          # JWT + password hashing
│   │   │   │   ├── apikeys.ts       # API key CRUD
│   │   │   │   ├── billing.ts       # Stripe integration
│   │   │   │   └── converters/      # Format-specific conversion logic
│   │   │   ├── queue/               # BullMQ queue + worker
│   │   │   ├── lib/                 # db, redis, s3, upload helpers
│   │   │   └── openapi.yaml         # Swagger spec
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   └── web/                          # React frontend
│       ├── src/
│       │   ├── pages/               # Landing, Login, Signup, Dashboard, etc.
│       │   ├── components/          # UI components
│       │   ├── context/             # AuthContext
│       │   └── lib/                 # API client, utilities
│       ├── nginx.conf               # Production nginx config
│       └── Dockerfile
├── docker-compose.yml
├── .env.example
└── .dockerignore
```

## Supported Conversions

| Input Format | Output Formats | Engine |
|---|---|---|
| PNG, JPG, WEBP, TIFF | PNG, JPG, WEBP | Sharp (libvips) |
| HEIC, HEIF | PNG, JPG, WEBP | Sharp (libheif) |
| SVG | PNG, JPG, WEBP | Sharp (librsvg) |
| PNG, JPG | SVG | imagetracerjs (raster tracing) |
| PDF | PNG, JPG, WEBP | pdfjs-dist + canvas + Sharp |
| RAW (CR2, NEF, ARW, DNG) | PNG, JPG, WEBP | Sharp |

### Conversion Options

| Option | Type | Default | Description |
|---|---|---|---|
| `outputFormat` | string | *required* | `png`, `jpg`, `webp`, or `svg` |
| `quality` | 1–100 | 80 (webp), 85 (jpg) | Compression quality |
| `width` | number | — | Resize width in px |
| `height` | number | — | Resize height in px |
| `fit` | string | `inside` | `cover`, `contain`, `fill`, `inside`, `outside` |
| `dpi` | number | 150 | PDF rasterization DPI |
| `page` | number | 1 | PDF page number (1-indexed) |
| `lossless` | boolean | false | Lossless WEBP compression |

## Database Schema

Four tables managed by Prisma ORM:

- **User** — `id`, `email` (unique), `password` (bcrypt, 12 rounds), `name`, `plan` (FREE / PAY_AS_YOU_GO), `stripeCustomerId`
- **ApiKey** — `id`, `userId`, `name`, `prefix` (e.g. `imgf_abc1234`), `hash` (SHA-256, unique), `lastUsedAt`, `revokedAt`
- **Job** — `id`, `userId`, `status` (PENDING / PROCESSING / COMPLETED / FAILED), `inputFormat`, `outputFormat`, `inputKey`, `outputKey`, `fileSize`, `error`, `webhookUrl`, `startedAt`, `completedAt`
- **UsageRecord** — `id`, `userId`, `jobId`, `inputFormat`, `outputFormat`, `inputBytes`, `outputBytes`, `durationMs`

Key indexes: `ApiKey.hash`, `Job(userId, createdAt)`, `Job.status`, `UsageRecord(userId, createdAt)`.

## Authentication

**JWT (Dashboard routes)**: `Authorization: Bearer {token}` — 7-day expiry, HS256 signed with `JWT_SECRET`.

**API Key (Conversion routes)**: `x-api-key: imgf_...` — Raw key shown once at creation, only SHA-256 hash stored in DB. Keys can be revoked (soft delete via `revokedAt`).

## Rate Limiting

| Scope | Limit | Window |
|---|---|---|
| General API | 100 requests | 15 minutes per IP |
| Auth (signup/login) | 10 requests | 15 minutes per IP |
| Conversions | 60 requests | 1 minute per IP |

Exceeding limits returns HTTP 429 with `{ "error": "Too many requests, please try again later" }`.

## Quota & Billing

| Plan | Monthly Limit | Billing |
|---|---|---|
| FREE | 100 conversions | None |
| PAY_AS_YOU_GO | Unlimited | Stripe metered (per conversion) |

- Quota resets on the first of each month.
- Sync conversions return `X-Quota-Remaining` and `X-Quota-Limit` headers.
- Stripe customer is created on signup (non-blocking). Each conversion reports 1 unit via `billing.meterEvents.create()`.

## Job Queue (Batch Processing)

- **Queue**: BullMQ with Redis
- **Concurrency**: Configurable via `WORKER_CONCURRENCY` (default: 3)
- **Retries**: 3 attempts with exponential backoff (2s → 4s → 8s)
- **Retention**: Completed jobs kept 24h, failed jobs kept 7 days
- **Webhook**: Optional `webhookUrl` on batch requests — POST on completion/failure
- **Graceful shutdown**: Worker listens for SIGINT/SIGTERM, drains in-progress jobs

Job lifecycle: `PENDING` → `PROCESSING` → `COMPLETED` (with S3 download URL) or `FAILED` (with error message).

## Object Storage (S3 / MinIO)

- Client: `@aws-sdk/client-s3` with path-style access (MinIO compatible)
- Bucket: `imageforge` (auto-created by `minio-init` container)
- Presigned download URLs expire after **1 hour**
- Key patterns:
  - Batch uploads: `batch/{batchId}/{originalName}`
  - Batch results: `results/{batchId}/{jobId}.{ext}`

## Security

- **Passwords**: bcrypt with 12 salt rounds
- **API keys**: SHA-256 hashed, raw key never stored
- **Helmet**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **CORS**: Configurable allowed origin
- **File validation**: Magic bytes detection, 50 MB size limit
- **Temp file cleanup**: `finally` blocks ensure temp files are removed
- **Non-blocking side effects**: Stripe reporting and usage logging don't block API responses

## Environment Variables

```env
# Server
PORT=4000                              # API server port
NODE_ENV=development                   # development | production
CORS_ORIGIN=http://localhost:3000      # Allowed CORS origin

# Database (PostgreSQL)
DATABASE_URL=postgresql://imageforge:imageforge@postgres:5432/imageforge

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=change-me-to-a-random-secret   # MUST change in production

# S3 / MinIO
S3_ENDPOINT=http://minio:9000         # Use service name in Docker
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=imageforge
S3_REGION=us-east-1

# Worker
WORKER_CONCURRENCY=3                   # Parallel job processing
UPLOAD_TEMP_DIR=/tmp/imageforge-uploads

# Stripe (optional — billing disabled if not set)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_METERED_PRICE_ID=price_...
```

Hostnames: Use Docker Compose service names (`postgres`, `redis`, `minio`) when running in Docker. Use `localhost` for local development.

## Deployment

### Prerequisites

- Docker & Docker Compose
- (Optional) Stripe account for billing

### Quick Start

```bash
# 1. Clone and enter the project
cd image-transformer

# 2. Create .env from example
cp .env.example .env
# Edit .env — at minimum change JWT_SECRET

# 3. Build and start all services
docker compose build
docker compose up -d

# 4. Verify
docker compose ps
curl http://localhost:4000/api/v1/health
```

### Services

| Service | Port | Description |
|---|---|---|
| **web** | 3000 | React frontend (nginx) |
| **api** | 4000 | Express API server |
| **worker** | — | BullMQ background worker (no exposed port) |
| **postgres** | 5432 | PostgreSQL 16 database |
| **redis** | 6379 | Redis 7 (queue + rate limiting) |
| **minio** | 9000 (API), 9001 (console) | S3-compatible object storage |
| **minio-init** | — | One-shot: creates the `imageforge` bucket |

### Docker Images

- **API/Worker**: `node:20-slim` with native libs (libvips, cairo, pango, etc.). Single image, different CMD for API vs Worker.
- **Web**: Multi-stage — `node:20-slim` for Vite build, `nginx:alpine` for serving. Nginx proxies `/api/` to the API container.

### Database Migrations

Migrations run automatically on API container startup via `prisma migrate deploy`. To create new migrations:

```bash
# Run inside the API container
docker compose exec api npx prisma migrate dev --name describe_change

# Copy migration files to host for version control
docker compose cp api:/app/packages/api/prisma/migrations packages/api/prisma/
```

### Local Development (without Docker)

```bash
# Start only infrastructure
docker compose up -d postgres redis minio minio-init

# Create packages/api/.env with localhost URLs
# DATABASE_URL=postgresql://imageforge:imageforge@localhost:5432/imageforge
# REDIS_URL=redis://localhost:6379
# S3_ENDPOINT=http://localhost:9000

# Install dependencies
npm install

# Push schema to database (dev only)
cd packages/api && npx prisma db push

# Run API + Worker + Frontend
npm run dev:api          # Terminal 1 — API on :4000
npm run dev:worker       # Terminal 2 — Worker
npm run dev:web          # Terminal 3 — Frontend on :5173
```

### Rebuilding After Code Changes

```bash
# Rebuild specific service
docker compose build api    # or: web, worker

# Restart with new image
docker compose up -d api worker web
```

### Logs

```bash
docker compose logs api --tail 50 -f
docker compose logs worker --tail 50 -f
docker compose logs web --tail 20
```

### Stopping

```bash
docker compose down          # Stop containers, keep volumes
docker compose down -v       # Stop containers AND delete volumes (data loss)
```

## Maintenance

### Database Backups

```bash
# Dump
docker compose exec postgres pg_dump -U imageforge imageforge > backup.sql

# Restore
docker compose exec -T postgres psql -U imageforge imageforge < backup.sql
```

### Scaling Workers

Increase worker concurrency by setting `WORKER_CONCURRENCY` in `.env`, then restart:

```bash
docker compose up -d worker
```

For horizontal scaling, run multiple worker containers (they share the Redis queue):

```bash
docker compose up -d --scale worker=3
```

### Monitoring

- **Health check**: `GET /api/v1/health` — returns `{"status":"ok"}` when the API is running
- **MinIO console**: `http://localhost:9001` — browse uploaded/converted files
- **Swagger docs**: `http://localhost:4000/api/docs` — interactive API reference
- **Redis queue**: Connect to Redis and inspect BullMQ keys (`bull:image-conversion:*`)

### Key Expirations & Retention

| Item | Lifetime |
|---|---|
| JWT tokens | 7 days |
| S3 presigned download URLs | 1 hour |
| Completed BullMQ jobs | 24 hours |
| Failed BullMQ jobs | 7 days |
| Temp upload files | Cleaned up immediately after processing |

### Production Checklist

- [ ] Set a strong random `JWT_SECRET`
- [ ] Change MinIO credentials (`S3_ACCESS_KEY`, `S3_SECRET_KEY`)
- [ ] Change PostgreSQL credentials
- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` to your frontend domain
- [ ] Set up Stripe keys for billing
- [ ] Use managed PostgreSQL / Redis / S3 in production
- [ ] Set up TLS termination (e.g. Cloudflare, nginx, or load balancer)
- [ ] Configure log aggregation
- [ ] Set up health check monitoring

## API Documentation

Interactive Swagger UI is available at `/api/docs` when the API is running. The OpenAPI 3.0.3 spec is in `packages/api/src/openapi.yaml`.

## Error Responses

All errors follow the format `{ "error": "message" }` with appropriate HTTP status codes:

| Code | Meaning |
|---|---|
| 400 | Missing required fields or invalid input |
| 401 | Invalid or missing JWT / API key |
| 409 | Email already registered |
| 413 | File exceeds 50 MB limit |
| 415 | Unsupported input format |
| 422 | Invalid conversion pair (e.g. PDF → SVG) |
| 429 | Rate limit or quota exceeded |
| 500 | Internal server error |
