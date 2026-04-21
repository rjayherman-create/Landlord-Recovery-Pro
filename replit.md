# Workspace

## Overview

TaxAppeal DIY (formerly NY Property Tax Grievance Assistant) — a full-stack web application that helps homeowners in NY, NJ, TX, and FL file their own property tax appeals without paying a professional firm's 50% commission.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite, Tailwind CSS, TanStack Query, react-hook-form, framer-motion
- **Auth**: Replit Auth (OpenID Connect + PKCE), `openid-client` v6, PostgreSQL session store

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/                  # Express API server (port 8080)
│   ├── property-tax-grievance/      # React + Vite frontend (port 19972)
│   ├── scar-filing/                 # SmallClaims AI — general small claims filing assistant
│   ├── landlord-recovery/           # Landlord Recovery — DIY landlord recovery tool (port 25790)
│   └── taxappeal-mobile/            # Expo React Native mobile app (iOS/Android)
├── lib/
│   ├── api-spec/                    # OpenAPI spec + Orval codegen config
│   ├── api-client-react/            # Generated React Query hooks
│   ├── api-zod/                     # Generated Zod schemas from OpenAPI
│   ├── db/                          # Drizzle ORM schema + DB connection
│   └── replit-auth-web/             # useAuth() hook for browser auth state
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── tsconfig.json
```

## Features

**Landlord Recovery** (`/landlord-recovery/`):
- Helps landlords recover unpaid rent, property damage, security deposits, and lease-break costs via DIY small claims filing
- 8-page app: landing, dashboard, case list, new case wizard (4 steps), case detail, how-it-works, resources, pricing
- Full CRUD for landlord cases (`landlord_cases` table with serial PK)
- AI-generated demand letters via GPT-4.1-mini
- 8-stage case status tracking (draft → demand sent → filed → hearing → judgment → collection → closed)
- State-by-state small claims reference (10 states)
- Navy + gold design, no emoji, professional tone
- Backend routes: `/api/landlord-cases` (CRUD + stats + generate-letter + status update)
- DB schema: `lib/db/src/schema/landlord-cases.ts`

**SmallClaims AI** (`/scar-filing/`):
- 10-state small claims filing wizard (NY, NJ, FL, TX, CA, PA, IL, OH, GA, NC)
- AI-powered statement generation, from-scratch court PDFs, Stripe $29 paywall, Resend email delivery
- Case lifecycle dashboard at `/cases/:id` — status tracking (8 states), editable updates, timeline, evidence list, download section
- Legal compliance: `/disclaimer`, `/terms`, `/refund` pages

**Property Tax Grievance** (`/property-tax-grievance/`):
- **User Accounts** — Replit Auth login/logout; cases are scoped to the logged-in user
- **Dashboard** — All grievance cases with statuses, stats, upcoming deadlines; case cards show computed county standard deadline (with passed/upcoming state) when no specific date is set
- **Create/Edit Grievance** — Form with auto-fill from NYC PLUTO, NYS ORPS (4.7M parcels), GPS, and OCR tax bill scanning
- **Step-by-step Guided Flow** — 4-step progress tracker (Property info → Comparables → Print → File); Step 1 requires parcel ID to be complete
- **Confidence Score** — Case strength (Strong/Moderate/Building) with percentage; computed from equalization rate + market value estimate
- **Auto-Comparable Sales** — One-click pull from NYS public sales database (data.ny.gov dataset 5ry4-ks3m) filtered by municipality and square footage
- **Prior Year Comparison** — Year-over-year assessment delta from NYS ORPS; flags >5% jumps as strong grievance grounds
- **County-Specific Filing Instructions** — Exact form, address, portal, and deadline for Nassau, Suffolk, all 5 NYC boroughs, Westchester, and all other NY counties
- **Deadline Banner (auto-computed)** — `getComputedDeadline(county)` in county-filing-instructions.ts returns the current year's deadline date for any county (e.g. Nassau = March 1, Suffolk = 3rd Tuesday of May); banner auto-shows passed/countdown without requiring the user to set a specific date
- **Filing Deadline Reminders** — Bell toggle per case; reminder stored in localStorage
- **Pre-Print Checklist** — "Before you print" verification step requiring explicit user confirmation on Parcel ID and Assessed Value against their physical tax bill
- **RP-524 Pre-filled Print Form** — Pixel-perfect replica of NYS complaint form, auto-populated from case data
- **County Guide** — Reference for all NY county procedures
- **Filing Deadlines Calendar** — `/calendar` route (not `/deadlines`); shows countdown to next deadline with .ics export
- **How It Works** — Educational content on the DIY grievance process

## SmallClaims AI (`/scar-filing`)

Standalone DIY small claims court filing assistant for 10 states (NY, NJ, FL, TX, CA, PA, IL, OH, GA, NC).

### Features
- **4-Step Wizard** — Claim type + state selection → Party/claim details → AI legal chat (SSE streaming) → AI statement generation
- **8 Claim Types** — Breach of contract, security deposit, property damage, unpaid wages, consumer dispute, landlord/tenant, negligence, personal property
- **AI Legal Assistant** — GPT-4.1-mini streaming chat assistant with case-specific context
- **AI Statement Generator** — Generates personalized statement of claim text via GPT-4.1-mini
- **Court PDF Download** — Generates filled PDF forms for each of the 10 supported states (pdf-lib)
- **Case Management** — List, view, delete cases; status tracking (draft → ready → filed → won/lost)
- **State Filing Guide** — Reference page with limits, fees, and procedures per state

### Key Files
- `artifacts/scar-filing/src/pages/FileWizard.tsx` — 4-step filing wizard
- `artifacts/scar-filing/src/pages/Cases.tsx` — Case list with PDF download buttons
- `artifacts/api-server/src/routes/cases.ts` — CRUD + generate-statement (also aliased at /small-claims)
- `artifacts/api-server/src/routes/pdf.ts` — PDF generation (`GET /api/cases/:id/pdf`)
- `artifacts/api-server/src/services/ai.ts` — AI service (improveClaim, generateStatement, chatWithAssistant)
- `artifacts/api-server/src/services/pdfFill.ts` — PDF form fill service (formMap for all 10 states)
- `artifacts/api-server/templates/` — 10 state PDF templates (generated by scripts/generate-templates.mjs)
- `lib/db/src/schema/small-claims.ts` — smallClaimsCasesTable schema

### DB Tables (SmallClaims)
- `small_claims_cases` — claimType, state, claimant/defendant info, amount, description, generatedStatement, status, conversationId
- `conversations` — AI chat sessions linked to cases
- `messages` — Individual AI chat messages

## API Routes

- `GET /api/healthz`
- `GET /api/auth/user` — Current auth state
- `GET /api/login`, `GET /api/callback`, `GET /api/logout` — OIDC auth flow
- `GET/POST /api/grievances` — List (user-scoped) / create grievances
- `GET/PUT/DELETE /api/grievances/:id` — Get/update/delete a grievance
- `GET/POST /api/comparables?grievanceId=N` — List/add comparables
- `DELETE /api/comparables/:id`
- `GET /api/auto-comparables?grievanceId=N` — Pull comparable sales from NYS data
- `GET /api/prior-year/:grievanceId` — Prior year assessment from NYS ORPS
- `GET /api/property-lookup?address=` — NYC PLUTO + NYS ORPS auto-fill
- `GET /api/reverse-geocode?lat=&lng=` — GPS → address
- `POST /api/ocr-tax-record` — AI OCR of uploaded tax bill image (GPT vision)
- `GET /api/counties` — NY county filing info

## DB Schema

- `sessions` table — Replit Auth session store (mandatory, do not drop)
- `users` table — Auth users (id, email, firstName, lastName, profileImageUrl)
- `grievances` table — owner info, property address, county, municipality, taxYear, assessments, status, filingDeadline, userId (nullable, scopes case to user)
- `comparables` table — linked to grievance, address, salePrice, saleDate, sqft, beds, baths, assessedValue
- `county_data` table — 160 records seeded (62 NY, 21 NJ, 33 TX, 44 FL counties) with tax_rate and equalization_rate per county; powers the Dashboard savings estimator's county-specific rate

## Auth

- Uses Replit Auth OIDC with PKCE (`openid-client` v6)
- Server: `src/lib/auth.ts` (session CRUD, OIDC config), `src/middlewares/authMiddleware.ts`, `src/routes/auth.ts`
- Frontend: `@workspace/replit-auth-web` provides `useAuth()` hook
- Cases are soft user-scoped: if logged in, filter by userId; if anonymous, filter by null userId

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` with `composite: true`. Root `tsconfig.json` lists all packages as references including `lib/replit-auth-web`.

## Mobile App (`taxappeal-mobile`)

Expo React Native app (iOS/Android/Web) — offline-first, separate from the web app grievance database.

### Features
- **Home** — savings summary card, quick actions (New Appeal, Estimator), recent cases, filing tip
- **Cases** — list of all local cases, with status badges and tap-to-detail navigation
- **New Case** — 3-step form (Property Info → Assessment Details → Review & Create)
- **Estimator** — savings estimator with state-specific tax rate estimates
- **Settings** — app preferences and help links
- **Case Detail** — full case view with status, next steps, and action buttons

### Key Files
- `artifacts/taxappeal-mobile/app/(tabs)/index.tsx` — Home screen
- `artifacts/taxappeal-mobile/app/(tabs)/cases.tsx` — Cases list
- `artifacts/taxappeal-mobile/app/(tabs)/new-case.tsx` — Multi-step new case form
- `artifacts/taxappeal-mobile/app/(tabs)/estimator.tsx` — Savings estimator
- `artifacts/taxappeal-mobile/app/(tabs)/settings.tsx` — Settings
- `artifacts/taxappeal-mobile/context/CasesContext.tsx` — AsyncStorage-backed case state

## Bug Fixes Applied

- **TypeScript `composite` flag** — `lib/replit-auth-web/tsconfig.json` fixed (was incorrectly named `composite-false`)
- **Lazy OpenAI init** — moved `new OpenAI()` inside route handler to avoid startup crash if `OPENAI_API_KEY` is absent
- **County-data route** — wrapped DB query in try/catch to return 500 instead of unhandled crash
- **`AuthUser` interface** — added to `lib/api-zod/src/index.ts` so `req.user.id` is typed across all routes
- **`generatePdf.ts`** — replaced `PDFDocument` as both type and value with `type PDFDoc = InstanceType<typeof PDFDocument>`
- **`prior-year.ts`** — fixed `unknown` → `Record<string, unknown>` cast in ORPS API response
- **GrievanceDetail delete confirmation** — replaced browser `confirm()` with Radix `AlertDialog` for comparable deletion; uses `compToDelete` state + `confirmDeleteComp` handler with toast feedback

## Ports

- API server: `PORT` env var (default 8080)
- Vite dev server: 3000 (proxies `/api` → `http://localhost:8080`)
- Expo Metro bundler: 19394
