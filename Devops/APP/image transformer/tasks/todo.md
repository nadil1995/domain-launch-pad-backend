# ImageForge SaaS - Image Conversion API Platform

## Overview
Reshape the client-side image-to-SVG app into an industrial-grade SaaS image conversion platform with a pay-as-you-go API. The platform will support bulk image conversions via REST API and a web dashboard.

### Supported Conversions
- PNG/JPG -> WEBP (web optimisation)
- HEIC -> JPG/PNG (Apple compatibility)
- SVG <-> PNG (design & web)
- PDF -> Image (PNG/JPG)
- RAW -> JPG (camera formats)
- Raster -> SVG (existing feature, kept)

### Architecture
```
Frontend (React + Vite)         Backend (Node.js + Express)
├── Landing page                ├── POST /api/v1/convert     (single file)
├── Dashboard                   ├── POST /api/v1/convert/batch (batch)
│   ├── API key management      ├── GET  /api/v1/jobs/:id    (job status)
│   ├── Usage & billing         ├── GET  /api/v1/usage       (usage stats)
│   └── Conversion playground   ├── POST /api/v1/auth/signup
└── Docs / API reference        ├── POST /api/v1/auth/login
                                ├── POST /api/v1/keys         (create API key)
                                ├── GET  /api/v1/keys         (list keys)
                                └── DELETE /api/v1/keys/:id   (revoke key)

Processing: Sharp + libvips (JPG/PNG/WEBP/HEIC/SVG)
            pdf-lib / pdf2pic (PDF -> image)
            dcraw / sharp (RAW -> JPG)
Queue:      BullMQ + Redis (batch jobs)
Storage:    S3-compatible (uploads + results)
DB:         PostgreSQL (users, keys, usage, jobs)
Auth:       JWT + API key header (x-api-key)
Billing:    Stripe (metered usage)
```

---

## Phase 1: Project Restructure & Backend Scaffold
- [x] Restructure into monorepo: `packages/web` (existing frontend) + `packages/api` (new backend)
- [x] Init `packages/api` with Express + TypeScript
- [x] Add shared config: `.env.example`, Docker Compose (Postgres + Redis + MinIO)
- [x] Set up TypeScript build for the API package
- [x] Add health check endpoint `GET /api/v1/health`

## Phase 2: Database & Auth
- [x] Set up PostgreSQL with Prisma ORM (schema: User, ApiKey, Job, UsageRecord)
- [x] User signup/login endpoints with bcrypt + JWT
- [x] API key generation (hashed storage, prefix display: `imgf_...`)
- [x] Auth middleware: JWT for dashboard, API key for conversion endpoints
- [x] Rate limiting middleware (express-rate-limit)

## Phase 3: Core Conversion Engine
- [x] Install Sharp, file-type, pdfjs-dist, canvas, imagetracerjs
- [x] Conversion service: `convert(input, outputFormat, options)`
  - [x] PNG/JPG -> WEBP (Sharp: quality, lossless)
  - [x] HEIC -> JPG/PNG (Sharp with libheif)
  - [x] SVG -> PNG/JPG/WEBP (Sharp rasterization via libvips)
  - [x] PNG/JPG -> SVG (imagetracerjs on server via node-canvas)
  - [x] PDF -> PNG/JPG/WEBP (pdfjs-dist + canvas + Sharp)
  - [x] RAW (CR2/NEF/ARW/DNG) -> JPG/PNG/WEBP (Sharp)
- [x] Input validation: file size limits (50MB), format detection (magic bytes + extension)
- [x] Output options: quality, width, height, fit mode, DPI, page, lossless

## Phase 4: API Endpoints & File Handling
- [x] File upload with Multer (temp disk storage, 50MB limit, single + multi)
- [x] `POST /api/v1/convert` — single-file sync conversion, returns binary file
- [x] `POST /api/v1/convert/batch` — multi-file async, returns batch ID + job IDs
- [x] `GET /api/v1/jobs/:id` — poll job status + presigned download URL
- [x] S3 upload/download helpers (presigned URLs, MinIO-compatible)
- [x] Webhook callback on batch completion (fire POST to user-provided URL)
- [x] Clean up temp files after processing (in finally blocks)

## Phase 5: Job Queue (Batch Processing)
- [x] Set up BullMQ with Redis + ioredis connection helper
- [x] Conversion worker: picks jobs, converts, uploads to S3, updates DB, records usage
- [x] Batch route refactored to enqueue via `conversionQueue.add()`
- [x] Concurrency control (configurable via `WORKER_CONCURRENCY`, default 3)
- [x] Retry with exponential backoff (3 attempts, 2s/4s/8s delays)
- [x] Failed jobs kept 7 days, completed jobs kept 24h (BullMQ auto-cleanup)
- [x] Separate worker entrypoint (`src/worker.ts`) with graceful shutdown

## Phase 6: Usage Tracking & Billing
- [x] Log every conversion: user, format, file size, duration, timestamp (sync + worker)
- [x] `GET /api/v1/usage` — usage stats (daily/monthly, by format, quota info)
- [x] Stripe integration: create customer on signup (non-blocking)
- [x] Metered billing: report usage to Stripe via billing meter events
- [x] Pricing tiers: FREE (100 conversions/month), PAY_AS_YOU_GO (unlimited)
- [x] Usage quota enforcement middleware on convert + batch endpoints

## Phase 7: Frontend Dashboard
- [x] React Router setup (landing, login, signup, dashboard)
- [x] Auth context (localStorage token/user persistence, login/signup/logout)
- [x] API client helper (`lib/api.ts` with ApiError class)
- [x] Protected routes (redirect to /login if no token)
- [x] Login & Signup pages
- [x] Dashboard layout with sidebar nav (Usage, API Keys, Playground) + Outlet
- [x] API Keys page (create with name, one-time reveal, list table, revoke, copy)
- [x] Usage page (quota card + progress bar, summary stats, by format, daily activity)
- [x] Playground page (file upload, format select, quality slider, convert via API, preview, download)
- [x] Landing page with hero, code snippet, format cards, features, pricing table
- [x] Updated index.html title
- [x] TypeScript type-check passes (tsc --noEmit)
- [x] Vite production build succeeds (265 KB JS, 21 KB CSS)

## Phase 8: API Documentation
- [x] OpenAPI/Swagger spec for all endpoints
- [x] Swagger UI served at `/api/docs`
- [x] Code examples in docs (curl, Python, Node.js)

## Phase 9: Dockerization & Deployment
- [x] Dockerfile for API (multi-stage: build + production with Sharp native deps)
- [x] Dockerfile for Worker (same image, different entrypoint)
- [x] Docker Compose: API + Worker + Web + Postgres + Redis + MinIO (S3 local)
- [x] Environment variable documentation
- [ ] CI/CD pipeline config (GitHub Actions: lint, test, build, push image)

## Phase 10: Forgot Password, Email Verification & reCAPTCHA
- [x] Install dependencies (resend backend, react-google-recaptcha frontend)
- [x] Prisma schema — add 5 fields to User (emailVerified, tokens, expiries)
- [x] Run Prisma migration
- [x] Backend config — add RESEND_API_KEY, EMAIL_FROM, FRONTEND_URL, RECAPTCHA_SECRET_KEY
- [x] Create email service (packages/api/src/services/email.ts) with Resend SDK
- [x] Create reCAPTCHA helper (packages/api/src/lib/recaptcha.ts)
- [x] Update auth service — token generation, email verification, password reset functions
- [x] Update auth routes — captcha on signup/login, 4 new endpoints
- [x] Create ForgotPassword page
- [x] Create ResetPassword page
- [x] Create VerifyEmail page
- [x] Create CheckEmail page
- [x] Update Login.tsx — reCAPTCHA widget + forgot password link
- [x] Update Signup.tsx — reCAPTCHA widget + redirect to /check-email
- [x] Update AuthContext.tsx — add emailVerified to user state
- [x] Update Dashboard.tsx — email verification banner
- [x] Update App.tsx — add 4 new routes
- [x] Update .env.example with new env vars
- [x] Update SECURITY.md with new auth sections

## Phase 11: Hardening & Production Readiness
- [ ] Input sanitization (prevent path traversal, zip bombs, SVG XSS)
- [ ] Request size limits and timeout handling
- [ ] Structured logging (pino)
- [ ] Error handling middleware with safe error responses
- [ ] API versioning strategy (v1 prefix)
- [ ] CORS configuration
- [ ] Graceful shutdown (drain queue, close DB connections)

---

## Review

### Phase 8 — API Documentation
- Created `packages/api/src/openapi.yaml` — full OpenAPI 3.0.3 spec covering all 10 endpoints with schemas (User, ApiKey, Job, UsageResponse, Error), two security schemes (BearerAuth JWT + ApiKeyAuth x-api-key header), and code examples (curl, Python, Node.js) for every endpoint
- Created `packages/api/src/routes/docs.ts` — loads the YAML spec with the `yaml` package and serves Swagger UI via `swagger-ui-express`
- Updated `packages/api/src/app.ts` — mounted docs router at `/api/docs` (before rate-limited routes)
- Installed `swagger-ui-express`, `yaml`, `@types/swagger-ui-express`
- TypeScript type-check passes (`npx tsc --noEmit`)

### Phase 9 — Dockerization & Deployment
- Created `.dockerignore` — excludes `node_modules`, `dist`, `.git`, `.env`, logs, etc. to keep Docker build context small
- Created `packages/api/Dockerfile` — multi-stage build using `node:20-slim`; build stage installs native build deps (libvips, cairo, pango, etc.), runs `npm ci`, generates Prisma client, builds TypeScript, copies `openapi.yaml` into `dist/`; production stage installs only runtime native libs, copies built artifacts; default CMD is `node dist/index.js`
- Created `packages/web/Dockerfile` — multi-stage build: Node for Vite build, `nginx:alpine` for serving static files
- Created `packages/web/nginx.conf` — serves SPA with `try_files` fallback to `index.html`, proxies `/api/` requests to `http://api:4000/api/` (docker-compose networking), 50MB upload limit
- Updated `docker-compose.yml` — added 4 new services: `api` (builds API image, runs Prisma migrations then starts server on port 4000), `worker` (same image as API, runs `node dist/worker.js`), `web` (builds web image, serves on port 3000 via nginx), `minio-init` (one-shot container using `minio/mc` to create the `imageforge` bucket)
- Updated `.env.example` — changed hostnames from `localhost` to Docker Compose service names (`postgres`, `redis`, `minio`), added `WORKER_CONCURRENCY`, `UPLOAD_TEMP_DIR`, `STRIPE_METERED_PRICE_ID`

### Phase 10 — Forgot Password, Email Verification & reCAPTCHA
- Added 5 fields to `User` model in Prisma schema: `emailVerified` (Boolean), `emailVerificationToken` (unique, hashed), `emailVerificationExpiry`, `passwordResetToken` (unique, hashed), `passwordResetExpiry`
- Created SQL migration `20260208120000_add_email_verify_and_password_reset`
- Installed `resend` (backend), `react-google-recaptcha` + `@types/react-google-recaptcha` (frontend)
- Updated `packages/api/src/config.ts` — added `email.resendApiKey`, `email.from`, `frontendUrl`, `recaptchaSecretKey`
- Created `packages/api/src/services/email.ts` — Resend SDK client with `sendVerificationEmail()` and `sendPasswordResetEmail()` functions
- Created `packages/api/src/lib/recaptcha.ts` — `verifyCaptcha()` POSTs to Google siteverify; returns `true` if `RECAPTCHA_SECRET_KEY` not set (dev bypass)
- Updated `packages/api/src/services/auth.ts` — added `generateVerificationToken()`, `verifyEmail()`, `generatePasswordResetToken()`, `resetPassword()`; all tokens are SHA-256 hashed before storage; `sanitizeUser()` now includes `emailVerified`
- Updated `packages/api/src/routes/auth.ts` — signup/login accept `captchaToken` and verify via `verifyCaptcha()`; 4 new endpoints: `POST /auth/verify-email`, `POST /auth/forgot-password` (always returns 200), `POST /auth/reset-password`, `POST /auth/resend-verification` (JWT-protected)
- Created 4 frontend pages: `ForgotPassword.tsx` (email form → "check email" message), `ResetPassword.tsx` (reads `?token=` → new password form), `VerifyEmail.tsx` (auto-verifies on mount), `CheckEmail.tsx` (post-signup with resend button)
- Updated `Login.tsx` — added reCAPTCHA widget (conditional on `VITE_RECAPTCHA_SITE_KEY`), "Forgot password?" link, location state for success messages
- Updated `Signup.tsx` — added reCAPTCHA widget, redirects to `/check-email` after signup
- Updated `AuthContext.tsx` — `User` interface includes `emailVerified`; `login`/`signup` accept optional `captchaToken`; added `setUser` to context
- Updated `Dashboard.tsx` — amber verification banner shown when `user.emailVerified === false` with resend button
- Updated `App.tsx` — added 4 new routes: `/forgot-password`, `/reset-password`, `/verify-email`, `/check-email`
- Updated `.env.example` — added `RESEND_API_KEY`, `EMAIL_FROM`, `FRONTEND_URL`, `RECAPTCHA_SECRET_KEY`, `VITE_RECAPTCHA_SITE_KEY`
- Updated `SECURITY.md` — added Email Verification, Password Reset, and reCAPTCHA v2 sections under Authentication
