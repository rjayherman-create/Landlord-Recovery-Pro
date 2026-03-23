# Workspace

## Overview

NY Property Tax Grievance Assistant — a full-stack web application that helps New York homeowners file their own property tax grievance without paying a professional firm's 50% commission.

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

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── property-tax-grievance/  # React + Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Features

- **Dashboard**: View all grievance cases with statuses (draft, submitted, pending, reduced, denied), stats, and upcoming deadlines
- **Create/Edit Grievance**: Form capturing property info, assessments, county, municipality, filing deadline
- **Grievance Detail**: Full case detail with comparable sales tracker
- **County Guide**: County-specific filing info for Nassau (AROW portal), Suffolk towns (RP-524), NYC (Tax Commission), Westchester, and upstate NY
- **How It Works**: Step-by-step guide explaining the DIY grievance process, BAR hearings, and SCAR

## API Routes

- `GET /api/healthz` — Health check
- `GET/POST /api/grievances` — List/create grievances
- `GET/PUT/DELETE /api/grievances/:id` — Get/update/delete a grievance
- `GET/POST /api/comparables?grievanceId=N` — List/add comparables
- `DELETE /api/comparables/:id` — Delete a comparable
- `GET /api/counties` — List NY counties with filing info (static data)

## DB Schema

- `grievances` table: owner info, property address, county, municipality, tax year, assessments, status, filing deadline
- `comparables` table: linked to grievance, address, sale price, sale date, sq ft, bedrooms, bathrooms, assessed value

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request/response validation and `@workspace/db` for persistence.

### `artifacts/property-tax-grievance` (`@workspace/property-tax-grievance`)

React + Vite frontend at `/`. Uses TanStack Query for data fetching, react-hook-form for forms, framer-motion for animations, shadcn/ui components.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Schema includes `grievancesTable` and `comparablesTable`.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec (`openapi.yaml`) and Orval config. Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.
