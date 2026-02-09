# ImageForge Security Documentation

## Overview

This document covers the security architecture, threat model, current protections, known risks, and hardening recommendations for the ImageForge platform.

---

## 1. Authentication

### JWT (Dashboard Routes)

| Property | Value |
|---|---|
| Algorithm | HS256 |
| Secret | `JWT_SECRET` environment variable |
| Expiration | 7 days |
| Payload | `{ sub: userId }` |
| Library | `jsonwebtoken` |

- Tokens are passed via `Authorization: Bearer <token>` header.
- On failure, the middleware returns a generic `"Invalid or expired token"` message (does not distinguish between expired, malformed, or invalid signature — prevents information leakage).
- If the database is unreachable during token verification, returns `503 "Authentication service unavailable"` rather than exposing internal errors.

### API Key (Conversion Routes)

| Property | Value |
|---|---|
| Format | `imgf_` + 32 random bytes (base64url), ~47 chars |
| Storage | SHA-256 hash only (raw key never stored) |
| Header | `x-api-key` |
| Lookup | Indexed hash column for O(1) database lookup |
| Revocation | Soft delete via `revokedAt` timestamp |

- The raw key is shown **once** at creation and cannot be retrieved afterward.
- Only the SHA-256 hash is stored in the database.
- Revoked keys are rejected even if the hash matches.
- `lastUsedAt` is updated non-blocking (fire-and-forget) to avoid slowing requests.

### Email Verification

| Property | Value |
|---|---|
| Token | 32 random bytes (hex-encoded) |
| Storage | SHA-256 hash only (raw token sent via email) |
| Expiration | 24 hours |
| Delivery | Resend SDK (transactional email) |

- On signup, a verification token is generated, hashed with SHA-256, and stored in the database.
- The raw token is sent to the user via email as a link: `FRONTEND_URL/verify-email?token=...`
- When the user clicks the link, the token is hashed again and matched against the database.
- Once verified, the token fields are cleared (single-use).
- Unverified users can log in but see a banner prompting verification.
- The `/auth/resend-verification` endpoint requires JWT authentication and generates a new token.

### Password Reset

| Property | Value |
|---|---|
| Token | 32 random bytes (hex-encoded) |
| Storage | SHA-256 hash only (raw token sent via email) |
| Expiration | 1 hour |
| Delivery | Resend SDK (transactional email) |

- The `/auth/forgot-password` endpoint always returns HTTP 200 regardless of whether the email exists (prevents email enumeration).
- If the email exists, a reset token is generated, hashed, and stored; the raw token is emailed as a link.
- The `/auth/reset-password` endpoint hashes the token, finds the user, validates expiry, then updates the password with bcrypt.
- Used tokens are cleared after successful reset (single-use).

### reCAPTCHA v2

| Property | Value |
|---|---|
| Type | Checkbox (explicit user action) |
| Endpoints protected | `/auth/signup`, `/auth/login` |
| Server verification | POST to `https://www.google.com/recaptcha/api/siteverify` |
| Dev bypass | Returns `true` if `RECAPTCHA_SECRET_KEY` is not set |

- The reCAPTCHA widget is rendered on the frontend if `VITE_RECAPTCHA_SITE_KEY` is set.
- The token is sent to the backend as `captchaToken` in the request body.
- The backend verifies the token with Google's siteverify API using the `RECAPTCHA_SECRET_KEY`.
- In development (no secret key configured), captcha verification is bypassed.

### Password Hashing

| Property | Value |
|---|---|
| Algorithm | bcrypt (via `bcryptjs`) |
| Salt Rounds | 12 |
| Comparison | `bcrypt.compare()` (constant-time) |

- Passwords are hashed with 12 rounds of bcrypt before storage.
- `bcrypt.compare()` is inherently timing-safe, preventing timing attacks on password verification.

---

## 2. Rate Limiting

All rate limits use `express-rate-limit` with draft-7 standard headers and are IP-based.

| Scope | Limit | Window | Endpoints |
|---|---|---|---|
| Global | 100 requests | 15 minutes | All endpoints |
| Authentication | 10 requests | 15 minutes | `/auth/signup`, `/auth/login` |
| Conversions | 60 requests | 1 minute | `/convert`, `/convert/batch` |

- Exceeding any limit returns HTTP 429: `{ "error": "Too many requests, please try again later" }`
- Rate limit headers are included in responses: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
- Legacy headers are disabled (`legacyHeaders: false`)

---

## 3. Quota Enforcement

| Plan | Monthly Limit | Enforcement |
|---|---|---|
| FREE | 100 conversions | Checked before every conversion |
| PAY_AS_YOU_GO | Unlimited | Quota middleware is bypassed |

- Quota counts are based on `UsageRecord` entries created after the start of the current calendar month (UTC).
- When exceeded, returns HTTP 429 with `limit`, `used`, `plan`, and `upgrade` fields.
- Response headers `X-Quota-Remaining` and `X-Quota-Limit` are set on successful conversions.
- **Fail-open behavior**: If the quota database query fails, the request is allowed through to avoid blocking legitimate users due to transient DB errors.

---

## 4. HTTP Security Headers

Helmet is applied as the first middleware, providing:

| Header | Value |
|---|---|
| Content-Security-Policy | Default restrictive sources |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | max-age=15552000 (180 days) |
| Referrer-Policy | no-referrer |
| X-Powered-By | Removed |

---

## 5. CORS

- Configured via `CORS_ORIGIN` environment variable (single origin string).
- Default: `http://localhost:3000` (Docker), `http://localhost:5173` (local dev).
- No wildcard origins are used — only the explicitly configured origin is allowed.
- In Docker, the nginx reverse proxy handles frontend-to-API communication internally, making CORS irrelevant for the primary use case.

---

## 6. File Upload Security

### Size Limits

| Limit | Value | Enforced By |
|---|---|---|
| Single file | 50 MB | Multer `fileSize` limit |
| Batch files | 20 files max | Multer `.array("files", 20)` |
| Nginx proxy | 50 MB | `client_max_body_size 50m` |

### Format Validation

Files are validated using a three-layer detection approach:

1. **Magic bytes** — `file-type` library reads the first bytes to detect the true MIME type (prevents extension spoofing)
2. **Extension fallback** — For formats not detectable by magic bytes (SVG, PDF), the filename extension is used
3. **SVG text detection** — First 512 bytes are checked for `<svg` or `<?xml` tags

Unsupported formats return HTTP 415. Invalid input-output format pairs return HTTP 422.

### Temp File Management

- Uploaded files are stored on disk at `UPLOAD_TEMP_DIR` (default: `/tmp/imageforge-uploads`).
- File naming: `{timestamp}-{random}{extension}` — prevents collisions, no user-controlled path components.
- Cleanup is performed in `finally` blocks after processing (fire-and-forget `fs.unlink()`).
- If the process crashes mid-conversion, temp files may remain until the container restarts or the OS cleans `/tmp`.

---

## 7. Database Security

### Connection

- PostgreSQL via Prisma ORM.
- Connection string in `DATABASE_URL` environment variable.
- Single `PrismaClient` instance (connection pooling handled by Prisma).

### Data Protection

| Data | Protection |
|---|---|
| Passwords | bcrypt hash (12 rounds) |
| API keys | SHA-256 hash (raw key never stored) |
| API key prefix | First 12 characters stored for user display |
| Stripe customer ID | Stored as-is (Stripe manages security) |

### Cascade Deletes

Deleting a user cascades to all related records:
- API keys
- Jobs
- Usage records

This ensures no orphaned data remains and supports GDPR-style account deletion.

### Indexes

- `ApiKey.hash` — Unique index for fast key lookups
- `Job(userId, createdAt)` — Efficient user job listing
- `Job.status` — Worker queue filtering
- `UsageRecord(userId, createdAt)` — Fast quota counting and analytics

---

## 8. S3 Object Storage

- Uses `@aws-sdk/client-s3` with path-style access (MinIO compatible).
- Pre-signed download URLs expire after **1 hour** (3600 seconds).
- Bucket name: `imageforge` (auto-created by `minio-init` container).
- No public access to the bucket — all access is through pre-signed URLs or server-side operations.

---

## 9. Redis Security

- Connection via `REDIS_URL` environment variable.
- Default configuration has **no authentication** (suitable for development only).
- BullMQ jobs stored in Redis contain file paths and user IDs in plaintext.
- For production, use Redis with `requirepass` or managed Redis with TLS.

---

## 10. Background Job Queue

| Property | Value |
|---|---|
| Queue | BullMQ (`image-conversion`) |
| Retries | 3 attempts, exponential backoff (2s, 4s, 8s) |
| Completed job retention | 24 hours |
| Failed job retention | 7 days |
| Concurrency | Configurable via `WORKER_CONCURRENCY` |

- Worker listens for SIGINT/SIGTERM for graceful shutdown (drains in-progress jobs).
- Jobs are not encrypted in Redis — sensitive data (file paths, user IDs) is stored in plaintext.

---

## 11. Stripe Integration

- Stripe API calls use `STRIPE_SECRET_KEY` (server-side only, never exposed to frontend).
- Webhook signature validation uses `STRIPE_WEBHOOK_SECRET`.
- Usage reporting is fire-and-forget — Stripe errors do not block conversions.
- Customer creation on signup is non-blocking — if Stripe is unavailable, the user is still created.

---

## 12. Docker & Network Security

### Exposed Ports (Development)

| Service | Host Port | Purpose |
|---|---|---|
| web (nginx) | 3000 | Frontend + API proxy |
| api | 4000 | API server |
| postgres | 5432 | Database |
| redis | 6379 | Cache/Queue |
| minio | 9000, 9001 | Object storage + console |

All services are exposed on the host in the development `docker-compose.yml`. In production, only ports 3000 (or 443 with TLS) should be exposed.

### Container Configuration

- Base images: `node:20-slim` (API/Worker), `nginx:alpine` (Web)
- Multi-stage builds exclude build tools from production images.
- `.dockerignore` excludes `.env`, `node_modules`, `.git`, logs from build context.
- Containers run as root by default (see hardening recommendations).
- Restart policy: `unless-stopped`.

### Nginx Proxy

- Forwards `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto` headers to the API.
- `client_max_body_size 50m` matches the API's upload limit.
- SPA routing with `try_files $uri $uri/ /index.html`.
- No TLS configured (HTTP only) — requires a TLS termination layer in production.

---

## 13. Middleware Execution Order

The Express middleware stack is applied in this order:

```
1. helmet()              — Security headers
2. cors()                — CORS validation
3. express.json()        — JSON body parser
4. generalLimiter        — 100 req/15min (all endpoints)
5. /api/docs             — Swagger UI (no additional auth)
6. /api/v1/health        — Health check (no auth)
7. authLimiter           — 10 req/15min (auth routes only)
8. /api/v1/auth/*        — Signup/login
9. requireJwt            — JWT validation (keys, usage routes)
10. requireApiKey        — API key validation (convert routes)
11. enforceQuota         — Monthly quota check
12. convertLimiter       — 60 req/min (convert routes only)
13. multer upload        — File handling
14. Route handler        — Business logic
```

This ordering ensures that security checks (rate limiting, auth, quota) run before any file processing or business logic.

---

## 14. Error Response Security

All error responses follow the format `{ "error": "message" }`. Sensitive details are not leaked:

| Scenario | Status | Message | Notes |
|---|---|---|---|
| Missing JWT | 401 | "No token provided" | |
| Invalid/expired JWT | 401 | "Invalid or expired token" | Generic (no distinction) |
| Missing API key | 401 | "Missing x-api-key header" | |
| Invalid/revoked key | 401 | "Invalid or revoked API key" | |
| DB unreachable | 503 | "Authentication service unavailable" | No stack trace |
| Invalid login | 401 | "Invalid email or password" | Generic (prevents enumeration) |
| Conversion failure | 500 | "Conversion failed" | No internal details |

**Exception**: The signup endpoint returns HTTP 409 for existing emails (`"Email already registered"`), which allows email enumeration. See Known Risks below.

---

## 15. Known Risks & Mitigations

### Critical

| Risk | Description | Mitigation |
|---|---|---|
| Weak JWT secret default | `config.ts` falls back to `"dev-secret-change-in-production"` if `JWT_SECRET` is not set | Always set a strong `JWT_SECRET` in `.env`. Generate with `openssl rand -base64 32` |
| `.env` in local API package | `packages/api/.env` contains real secrets and may be committed to Git | Add `packages/api/.env` to `.gitignore`. Rotate any exposed secrets |
| Default database credentials | `imageforge`/`imageforge` used in development | Use strong credentials in production |
| Default MinIO credentials | `minioadmin`/`minioadmin` hardcoded | Change via `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` in production |

### High

| Risk | Description | Mitigation |
|---|---|---|
| Email enumeration on signup | Returns 409 for existing emails | Partially mitigated: forgot-password always returns 200; signup still reveals existence. Consider unifying signup response |
| Fail-open quota check | If the quota DB query fails, the request proceeds | Add alerting on quota check failures; consider fail-closed with a grace period |
| No TLS between services | Docker services communicate over unencrypted HTTP | Use TLS or a service mesh in production |
| All ports exposed | Development compose exposes every service to the host | Remove port mappings for internal services (postgres, redis, minio) in production |
| Redis unauthenticated | No password configured by default | Set `requirepass` in Redis config or use `redis://user:password@host` URL |

### Medium

| Risk | Description | Mitigation |
|---|---|---|
| API key timing attack | SHA-256 hash comparison via Prisma may not be constant-time | Use `crypto.timingSafeEqual()` for the final comparison |
| No webhook URL validation | Batch `webhookUrl` accepts any string | Validate URL format, require HTTPS, consider a domain allowlist |
| Stack traces in logs | `console.error` logs full error stacks | Use structured logging (e.g. pino) with sensitive field redaction |
| Temp file leak on crash | `fs.unlink()` runs in `finally` but not on process crash | Use periodic cleanup cron or tmpwatch; container restarts clean `/tmp` |
| Containers run as root | Default Docker user is root | Add `USER node` directive to Dockerfiles |
| No request body size limit on JSON | `express.json()` uses default limit (100kb) | Explicitly set `express.json({ limit: '1mb' })` if needed |

### Low

| Risk | Description | Mitigation |
|---|---|---|
| Swagger UI publicly accessible | `/api/docs` has no auth requirement | Restrict access in production via IP allowlist or auth |
| Conversion options unbounded | Quality, width, height, DPI not range-validated | Add validation: quality 1–100, width/height 1–10000, DPI 72–600 |
| No account lockout | Unlimited login attempts (within rate limit) | Implement account lockout after N failed attempts |

---

## 16. Production Hardening Checklist

### Secrets & Configuration

- [ ] Generate a strong random `JWT_SECRET` (min 256 bits): `openssl rand -base64 32`
- [ ] Set strong PostgreSQL credentials (not `imageforge`/`imageforge`)
- [ ] Set strong MinIO credentials (not `minioadmin`/`minioadmin`)
- [ ] Set strong Redis password via `REDIS_URL=redis://user:password@host:6379`
- [ ] Set `NODE_ENV=production`
- [ ] Set `CORS_ORIGIN` to your actual frontend domain
- [ ] Ensure `packages/api/.env` is in `.gitignore` and not committed
- [ ] Rotate any secrets that may have been exposed in version control
- [ ] Configure Stripe production keys

### Network & Infrastructure

- [ ] Remove host port mappings for internal services (postgres, redis, minio)
- [ ] Only expose ports 443 (HTTPS) or 3000/4000 behind a load balancer
- [ ] Set up TLS termination (Cloudflare, AWS ALB, or nginx with certbot)
- [ ] Enable TLS for PostgreSQL connections (`?sslmode=require` in DATABASE_URL)
- [ ] Use managed services (RDS, ElastiCache, S3) in production where possible
- [ ] Define Docker network segments (frontend, backend, data) to isolate services
- [ ] Set memory and CPU limits on containers

### Application Security

- [ ] Add `USER node` to Dockerfiles (run as non-root)
- [ ] Validate conversion options with bounds (quality 1–100, dimensions 1–10000, DPI 72–600)
- [ ] Validate webhook URLs (require HTTPS, format check)
- [ ] Add `crypto.timingSafeEqual()` for API key hash comparison
- [ ] Consider replacing email enumeration on signup with a verification email flow
- [ ] Implement account lockout after repeated failed logins
- [ ] Add structured logging with sensitive field redaction (replace `console.error`)
- [ ] Restrict `/api/docs` access in production
- [ ] Set up periodic temp file cleanup (cron or OS-level tmpwatch)
- [ ] Add virus/malware scanning for uploaded files (ClamAV)

### Monitoring & Alerting

- [ ] Log all authentication failures (failed logins, invalid/revoked API keys)
- [ ] Monitor rate limit hits (potential brute force or abuse)
- [ ] Alert on quota check failures (fail-open behavior)
- [ ] Set up health check monitoring (`GET /api/v1/health`)
- [ ] Monitor disk usage on temp directory and S3 bucket
- [ ] Track error rates per endpoint

---

## 17. Dependency Security

Key security-sensitive dependencies:

| Package | Purpose | Notes |
|---|---|---|
| `bcryptjs` | Password hashing | Pure JS implementation, timing-safe |
| `jsonwebtoken` | JWT sign/verify | Widely used, actively maintained |
| `helmet` | Security headers | Applies sensible defaults |
| `express-rate-limit` | Rate limiting | IP-based, draft-7 headers |
| `multer` | File uploads | Disk storage with size limits |
| `file-type` | Magic byte detection | Prevents extension spoofing |
| `@aws-sdk/client-s3` | S3 operations | Official AWS SDK |
| `@prisma/client` | Database ORM | Parameterized queries (SQL injection safe) |

Run `npm audit` regularly to check for known vulnerabilities. The project does not currently have a lock file committed (workspace root `package-lock.json` exists but platform-specific optional deps vary), which means dependency versions may differ across environments.

---

## 18. Data Flow & Trust Boundaries

```
                           ┌─────────────────────────────────────────────┐
                           │              TRUST BOUNDARY                  │
                           │                                             │
  User Browser ──────────► │  Nginx (:3000)                              │
       │                   │    ├── Static files (React SPA)             │
       │                   │    └── /api/* proxy ──► Express API (:4000) │
       │                   │                          ├── Auth MW        │
       │                   │                          ├── Rate Limit MW  │
       │                   │                          ├── Quota MW       │
       │                   │                          ├── Multer (files) │
       │                   │                          └── Route Handler  │
       │                   │                               ├── S3 (MinIO)│
       │                   │                               ├── PostgreSQL│
       │                   │                               └── Redis     │
       │                   │                                    │        │
       │                   │                          Worker ◄──┘        │
       │                   │                          (BullMQ)           │
       │                   └─────────────────────────────────────────────┘
       │
  External APIs ◄── Stripe (billing, non-blocking)
```

**Trust boundaries**:
- All user input (HTTP requests, uploaded files) is untrusted and validated at the API layer.
- Inter-service communication (API ↔ PostgreSQL, Redis, MinIO) is trusted within the Docker network.
- Stripe API calls are outbound only; incoming webhooks should be validated with `STRIPE_WEBHOOK_SECRET`.
