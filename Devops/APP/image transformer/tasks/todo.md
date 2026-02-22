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
- [x] CI/CD pipeline config (Jenkinsfile: lint, type-check, build, Docker build + push)

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

## Phase 11: Guest, Free, Subscriber Access Tiers
- [x] Prisma schema — add GuestSession model + run migration
- [x] Config changes — freeMonthlyConversions 100→10, add guestTotalConversions: 5, guestCookieSecret
- [x] Install cookie-parser
- [x] Extend auth middleware — add authType, guestSessionId to Request, add requirePaidPlan
- [x] Create guest auth middleware (authenticateWebUser)
- [x] Create playground routes (POST /playground/convert, GET /playground/quota)
- [x] Restrict existing API routes to paid users (convert, batch, keys POST)
- [x] Mount cookie-parser + playground router in app.ts, CORS credentials
- [x] Create TryItWidget frontend component
- [x] Update Landing page — embed TryItWidget, update pricing tiers
- [x] Refactor Playground page — JWT auth, remove API key input, use /playground/convert
- [x] Gate API Keys page for paid users
- [x] Update Dashboard sidebar — badge on API Keys for free users
- [x] Update Usage page — quota 100→10
- [x] Update .env.example with GUEST_COOKIE_SECRET

## Phase 12: New Pricing Tiers, Firebase Auth, SEO & Clickable Format Cards
- [x] Prisma schema — expand Plan enum (STARTER, PRO, BUSINESS), add firebaseUid
- [x] Create migration SQL
- [x] Config — per-plan quotas, Firebase config, Stripe price IDs
- [x] Install dependencies (firebase-admin, firebase)
- [x] Backend auth middleware — requirePaidPlan for BUSINESS + PAY_AS_YOU_GO
- [x] Backend quota middleware — per-plan lookup
- [x] Backend keys route — allow BUSINESS + PAY_AS_YOU_GO
- [x] Backend playground route — optionalJwt (guests can convert/preview, auth users get quota tracking)
- [x] Backend billing — include BUSINESS in Stripe reporting
- [x] Backend Firebase auth — loginWithFirebase service + POST /auth/firebase route
- [x] Frontend Firebase setup (lib/firebase.ts)
- [x] Frontend AuthContext — add loginWithGoogle
- [x] Frontend Login + Signup — Google sign-in button
- [x] Frontend Landing page — 5 pricing tiers (Free, $5 Starter, £9 Pro, £19 Business, PAYG), clickable format cards
- [x] Frontend TryItWidget — guests can convert (preview), download gated behind registration
- [x] Frontend Dashboard — hasApiAccess logic, badge updates
- [x] Frontend ApiKeysPage — allow BUSINESS plan
- [x] Frontend UsagePage — per-plan quota display
- [x] Frontend Playground — remove guest refs, update quota display
- [x] SEO — meta tags and structured data in index.html
- [x] Update .env.example with Firebase + Stripe tier env vars
- [x] Review summary

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

### Phase 12 — New Pricing Tiers, Firebase Auth, SEO & Clickable Format Cards
- Expanded `Plan` enum: added `STARTER`, `PRO`, `BUSINESS` alongside existing `FREE` and `PAY_AS_YOU_GO`
- Added `firebaseUid String? @unique` to `User` model; created migration SQL `20260209180000_add_pricing_tiers_and_firebase`
- Replaced flat `quotas.freeMonthlyConversions` config with per-plan map: `{ FREE: 5, STARTER: 100, PRO: 500, BUSINESS: -1, PAY_AS_YOU_GO: -1 }` (-1 = unlimited)
- Added `firebase.projectId` config and Stripe tier price IDs (`starterPriceId`, `proPriceId`, `businessPriceId`)
- Installed `firebase-admin` (API) and `firebase` (web)
- Updated `requirePaidPlan` middleware to allow both `BUSINESS` and `PAY_AS_YOU_GO` for API access
- Rewrote `enforceQuota` middleware to look up `config.quotas[user.plan]` instead of hardcoded values
- Updated keys route POST handler to allow `BUSINESS` plan alongside `PAY_AS_YOU_GO`
- Added `optionalJwt` middleware to `auth.ts` — tries JWT but allows unauthenticated requests through as guests
- Rewrote `playground.ts` — uses `optionalJwt` instead of `requireJwt` for convert endpoint; guests can convert (preview) but no usage tracking; authenticated users get quota enforcement; sends `X-Authenticated` header for frontend download gating
- Updated `reportUsageToStripe` in billing service to also report for `BUSINESS` plan users
- Added `loginWithFirebase(idToken)` to auth service — verifies Firebase ID token via `firebase-admin`, finds/creates user by `firebaseUid` or email, links accounts, auto-verifies email
- Added `POST /auth/firebase` route accepting `{ idToken }`
- Created `packages/web/src/lib/firebase.ts` — Firebase client init with `VITE_FIREBASE_*` env vars
- Added `loginWithGoogle()` to `AuthContext` — uses `signInWithPopup` with Google provider, posts ID token to `/auth/firebase`
- Added "Continue with Google" button with Google SVG icon + "or" divider to both `Login.tsx` and `Signup.tsx`
- Rewrote `Landing.tsx` — 5 pricing tiers (Free $0, Starter $5, Pro £9, Business £19, Pay-as-you-go $0.01/conv) in responsive 5-column grid; Starter/Pro marked "No API access"; format cards clickable with `onClick` → sets output format + smooth scrolls to TryItWidget; updated text to "Try a conversion right here. Sign up to download"
- Rewrote `TryItWidget.tsx` — accepts `defaultOutputFormat` prop with `useEffect` sync; guests can convert and see preview; download button gated behind auth — shows "Sign up to download" CTA for non-registered users
- Updated `Dashboard.tsx` — `hasApiAccess` checks `BUSINESS` or `PAY_AS_YOU_GO`; badge shows "Business" instead of "Pro"
- Updated `ApiKeysPage.tsx` — allows `BUSINESS` plan; updated upgrade text
- Updated `UsagePage.tsx` — per-plan quota map replaces hardcoded `10`; `isUnlimited` check replaces `isPaid`; plan badge shows correct tier name
- Rewrote `Playground.tsx` — removed guest references; fetches quota only when token exists; uses `type: "limited" | "unlimited"` instead of old type system
- Added SEO to `index.html` — meta description, keywords, Open Graph tags, Twitter Card tags, JSON-LD structured data with SoftwareApplication schema and 4 pricing offers
- Updated `.env.example` — added `FIREBASE_PROJECT_ID`, `VITE_FIREBASE_*` vars, `STRIPE_STARTER_PRICE_ID`, `STRIPE_PRO_PRICE_ID`, `STRIPE_BUSINESS_PRICE_ID`
- TypeScript type-check passes for both packages (`npx tsc --noEmit`)

## Phase 15: API Docs Page — Multi-Language Code Samples
- [x] Create `packages/web/src/pages/DocsPage.tsx` — tabbed UI with 10 language tabs (Bash/cURL, Python, PHP, Node.js, React/TypeScript, Go, Ruby, Java, C#/.NET, Rust), CodeBlock component with copy-to-clipboard, 5 sections (Getting Started, Authentication, Single Conversion, Batch + Polling, Usage)
- [x] Add `BookOpen` icon + "API Docs" nav item to Dashboard sidebar
- [x] Add `<Route path="docs">` under dashboard children in App.tsx
- [x] Update `tasks/todo.md` with Phase 15 checklist
- [x] TypeScript type-check passes (`npx tsc --noEmit` in `packages/web`)

### Phase 15 — API Docs Page Review
- Created `packages/web/src/pages/DocsPage.tsx` — new page with 10 language tabs (Bash/cURL, Python, PHP, Node.js, React/TypeScript, Go, Ruby, Java, C#/.NET, Rust). Each tab shows 4 code blocks covering the full API workflow: authentication (signup/login/create key), single image conversion (POST /convert multipart), batch conversion with polling (POST /convert/batch + GET /jobs/:id), and usage tracking (GET /usage). Includes a reusable `CodeBlock` component with dark theme `<pre><code>` and copy-to-clipboard toggle (Copy/Check icons from lucide-react). Getting Started section shows base URL, auth overview, and supported format badges.
- Modified `packages/web/src/pages/Dashboard.tsx` — added `BookOpen` to lucide-react imports; added "API Docs" nav item pointing to `/dashboard/docs` after Playground in the sidebar
- Modified `packages/web/src/App.tsx` — imported `DocsPage`; added `<Route path="docs" element={<DocsPage />} />` under dashboard children between playground and admin routes
- Zero new dependencies. No backend changes. TypeScript type-check passes.

### Phase 11 — Guest, Free, Subscriber Access Tiers
- Added `GuestSession` model to Prisma schema (id, token, conversionCount, ipAddress, timestamps) with migration SQL
- Updated `config.ts` — `freeMonthlyConversions` 100→10, added `guestTotalConversions: 5`, `guestCookieSecret` env var
- Installed `cookie-parser` + `@types/cookie-parser`
- Extended `Express.Request` with `guestSessionId?: string` and `authType?: 'jwt' | 'apikey' | 'guest'`; set `authType` in `requireJwt` and `requireApiKey`
- Created `requirePaidPlan` middleware — checks user plan is PAY_AS_YOU_GO, returns 403 otherwise
- Created `packages/api/src/middleware/guestAuth.ts` — `authenticateWebUser` tries JWT first, then guest cookie, then creates new GuestSession with httpOnly cookie (1-year maxAge, sameSite: lax)
- Created `packages/api/src/routes/playground.ts` — `POST /playground/convert` (guests: increment count + 5 total limit, free: usage record + 10/month, paid: usage record + Stripe report) and `GET /playground/quota` (returns type/used/limit)
- Added `requirePaidPlan` after `requireApiKey` on `POST /convert`, `POST /convert/batch`, `GET /jobs/:id`
- Added plan check in `POST /keys` handler — returns 403 if user is not PAY_AS_YOU_GO
- Updated `app.ts` — added `cookieParser`, mounted `playgroundRouter`, enabled CORS `credentials: true`
- Created `packages/web/src/components/TryItWidget.tsx` — file upload, format/quality selection, calls `/playground/convert` with credentials, shows remaining counter, signup/upgrade prompts on 429
- Updated `Landing.tsx` — embedded `<TryItWidget />` "Try it now" section between Hero and Formats; updated pricing: Free shows "10 conversions / month" + "Web playground access", Pay-as-you-go shows "API key access"
- Rewrote `Playground.tsx` — removed API key input, uses JWT via `useAuth()`, calls `/playground/convert`, fetches quota on mount, shows remaining/unlimited badge
- Updated `ApiKeysPage.tsx` — free users see upgrade prompt card with lock icon instead of key management UI
- Updated `Dashboard.tsx` — "Pro" badge on "API Keys" nav item for free users
- Updated `UsagePage.tsx` — hardcoded quota 100→10
- Updated `.env.example` — added `GUEST_COOKIE_SECRET`

## Phase 13: Error Handling, Admin Dashboard, Seed Data & Documentation
- [x] Extract AppError to `packages/api/src/lib/errors.ts`
- [x] Update all imports to use centralized AppError (auth service re-exports for compat)
- [x] Wrap converter errors with AppError (sharp-convert, pdf-convert, svg-trace)
- [x] Create global error handler middleware (`middleware/errorHandler.ts`)
- [x] Simplify all route catch blocks to use `next(err)` — 6 route files updated
- [x] Add Role enum + role field to User model (Prisma schema + migration SQL)
- [x] Update auth service `sanitizeUser()` to expose role
- [x] Create `requireAdmin` middleware in `middleware/auth.ts`
- [x] Create admin API routes (`GET /api/v1/admin/stats`)
- [x] Mount admin router + error handler in `app.ts`
- [x] Install recharts in web package
- [x] Update frontend User interface for role in AuthContext
- [x] Create AdminPage with summary cards, line/pie/bar charts, recent users table
- [x] Add admin route in App.tsx
- [x] Add admin nav item (Shield icon) to Dashboard sidebar — only visible for ADMIN role
- [x] Create seed script (`prisma/seed.ts`) — 6 users with realistic usage data
- [x] Configure prisma seed command in `package.json`
- [x] Update tasks/todo.md with Phase 13 checklist

### Phase 13 — Error Handling, Admin Dashboard, Seed Data
- Extracted `AppError` class from `services/auth.ts` into `packages/api/src/lib/errors.ts`; `auth.ts` re-exports for backward compatibility
- Updated all imports (6 route files + `converters/detect.ts`) to use `../lib/errors.js`
- Wrapped converter errors in `sharp-convert.ts`, `pdf-convert.ts`, `svg-trace.ts` with try-catch → `AppError(422, ...)` so corrupt files return structured JSON instead of raw crash
- Created `packages/api/src/middleware/errorHandler.ts` — Express error middleware that logs context (method, path, userId) and returns `{ error, statusCode }` for AppError or generic 500 for unknown errors
- Simplified all route catch blocks (auth, convert, batch, keys, usage, playground) to `catch(err) { next(err); }` — error handling is now centralized
- Added `enum Role { USER ADMIN }` and `role Role @default(USER)` to User model in Prisma schema; created migration SQL `20260210120000_add_user_role`
- Updated `sanitizeUser()` in auth service to include `role` in API responses
- Added `requireAdmin` middleware to `middleware/auth.ts` — checks `user.role === "ADMIN"`, returns 403 otherwise
- Created `packages/api/src/routes/admin.ts` — `GET /api/v1/admin/stats` protected by `requireJwt` + `requireAdmin`; returns `totalUsers`, `totalConversions`, `planDistribution`, `signupsByDay`, `conversionsByDay`, `popularFormats`, `recentUsers`
- Mounted `adminRouter` + `errorHandler` in `app.ts`
- Installed `recharts` in web package
- Added `role: string` to User interface in `AuthContext.tsx`
- Created `packages/web/src/pages/AdminPage.tsx` — summary cards (total users, total conversions), line chart (daily conversions 30d), pie chart (plan distribution), bar chart (popular formats), recent users table
- Added `/dashboard/admin` route in `App.tsx`
- Added "Admin" nav item with Shield icon to Dashboard sidebar — conditionally rendered when `user.role === "ADMIN"`
- Created `packages/api/prisma/seed.ts` — upserts 6 users (`admin@imageforge.dev` ADMIN/BUSINESS, `free@imageforge.dev` FREE, `starter@imageforge.dev` STARTER, `pro@imageforge.dev` PRO, `business@imageforge.dev` BUSINESS, `payg@imageforge.dev` PAY_AS_YOU_GO) all with password `password123`; generates realistic usage records (varied formats, 30 days, proportional to plan); deletes existing seed records for idempotency
- Added `prisma.seed` config + `seed` npm script to `packages/api/package.json`
- TypeScript type-check passes for both `packages/api` and `packages/web`

## Phase 14: Enhanced Image Quality + maxSize Output Limit
- [x] Add `maxSize?: number` to `ConvertOptions` in `types.ts`
- [x] Add `maxSize` to `ConversionJobData` options in `conversion.queue.ts`
- [x] Add subtle sharpen step (`sigma: 0.5`) after resize in `sharp-convert.ts`
- [x] Add maxSize reduction loop in `sharp-convert.ts` (iteratively lowers quality for lossy formats)
- [x] Parse `maxSize` param in `routes/convert.ts`
- [x] Parse `maxSize` param in `routes/playground.ts`
- [x] Parse `maxSize` param in `routes/batch.ts`
- [x] Document `maxSize` in OpenAPI spec (`openapi.yaml`) for `/convert` and `/convert/batch`
- [x] Document `maxSize` in `API_GUIDE.md` (parameter table + example)
- [x] Update `tasks/todo.md` with checklist

### Phase 14 — Enhanced Image Quality + maxSize Output Limit
- Added `maxSize?: number` to `ConvertOptions` interface in `types.ts`
- Added `maxSize?: number` to `ConversionJobData.options` in `conversion.queue.ts`
- Added `pipeline.sharpen({ sigma: 0.5 })` after the resize block in `sharp-convert.ts` — applies a subtle sharpen to all raster output for improved perceived quality
- Implemented maxSize reduction loop in `sharp-convert.ts`: after initial `toBuffer()`, if `maxSize` is set and output exceeds it and format is lossy (JPG/WebP), rebuilds from the original input with quality reduced by 5 per iteration (minimum quality 10). PNG is excluded (lossless). If `lossless: true` + `maxSize` are both set, forces lossy encoding (maxSize wins). Rebuilds from original input each iteration to avoid compounding artifacts.
- Added `maxSize` parsing in `routes/convert.ts`, `routes/playground.ts`, and `routes/batch.ts` — one line each using existing `parseOptionalInt` helper
- Added `maxSize` integer field to OpenAPI spec for both `/convert` and `/convert/batch` request schemas
- Added `maxSize` to the conversion parameters table in `API_GUIDE.md` with description, plus a curl example showing `maxSize=102400` (100KB limit)

## Phase 16: Enhanced Admin Dashboard — Analytics & BI-Friendly API
- [x] Create `packages/api/src/services/analytics.ts` — centralized analytics queries (getOverview, getUserAnalytics, getConversionAnalytics, getRevenueAnalytics, getLegacyStats)
- [x] Modify `packages/api/src/routes/admin.ts` — add 4 new endpoints (overview, users, conversions, revenue), refactor legacy stats to service
- [x] Modify `packages/web/src/pages/AdminPage.tsx` — tabbed layout (Overview, Users, Conversions, Revenue), date range filter, KPI cards, charts
- [x] TypeScript type-check passes (`npx tsc --noEmit` in both packages)
- [x] Update `tasks/todo.md` with Phase 16 checklist

### Phase 16 — Enhanced Admin Dashboard Review
- Created `packages/api/src/services/analytics.ts` — new centralized analytics service with 5 exported functions and a date range helper. `getOverview()` returns 9 KPIs (total/paid/active users, conversions, data processed, MRR, PAYG revenue). `getUserAnalytics()` returns plan distribution, daily user growth with cumulative totals, top users sorted by conversion count with pagination (limit/offset). `getConversionAnalytics()` returns daily volume, format breakdown, by-plan breakdown, and aggregate averages (duration, input/output bytes). `getRevenueAnalytics()` returns current MRR, MRR by plan, PAYG revenue, daily MRR snapshots, and paid user growth. `getLegacyStats()` preserves exact existing response shape for backward compatibility. All functions use `Promise.all` for parallel queries. Plan pricing constants (`PLAN_PRICE`, `PAYG_RATE`) drive revenue calculations.
- Modified `packages/api/src/routes/admin.ts` — replaced 80 lines of inline query logic with service function calls. Added 4 new BI-friendly endpoints: `GET /admin/overview` (flat KPI JSON), `GET /admin/users?from=&to=&limit=&offset=` (user analytics with pagination), `GET /admin/conversions?from=&to=` (conversion analytics), `GET /admin/revenue?from=&to=` (revenue analytics). All protected by existing `requireJwt + requireAdmin` middleware. Legacy `GET /admin/stats` preserved unchanged. All responses use flat JSON, camelCase fields, ISO 8601 dates, array-of-objects format for BI tool compatibility.
- Modified `packages/web/src/pages/AdminPage.tsx` — refactored from single flat layout to tabbed layout with 4 tabs (Overview, Users, Conversions, Revenue). Added date range picker (two `<input type="date">` fields, default last 30 days) shared across Users/Conversions/Revenue tabs. Each tab lazy-loads its data via `useEffect` on tab/date change. Overview tab: 9 KPI cards in 3-column grid. Users tab: plan distribution PieChart, user growth dual-axis LineChart (daily + cumulative), top users table with conversions column. Conversions tab: 4 stats cards (total, avg duration/input/output), daily volume LineChart, conversions-by-plan PieChart, format breakdown BarChart. Revenue tab: 3 KPI cards (MRR, PAYG, subscribers), MRR by plan BarChart, revenue over time LineChart, paid user growth dual-axis LineChart, plan breakdown table. Added inline `KpiCard` component matching existing card styling. Added `formatBytes`, `formatDuration`, `formatCurrency` helpers. All charts use existing recharts imports. Zero new dependencies.
