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

## Auth

- Uses Replit Auth OIDC with PKCE (`openid-client` v6)
- Server: `src/lib/auth.ts` (session CRUD, OIDC config), `src/middlewares/authMiddleware.ts`, `src/routes/auth.ts`
- Frontend: `@workspace/replit-auth-web` provides `useAuth()` hook
- Cases are soft user-scoped: if logged in, filter by userId; if anonymous, filter by null userId

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` with `composite: true`. Root `tsconfig.json` lists all packages as references including `lib/replit-auth-web`.

## Ports

- API server: `PORT` env var (default 8080)
- Vite dev server: 19972
- Vite proxies `/api` → `http://localhost:8080`
