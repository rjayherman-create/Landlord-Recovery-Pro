# Railway Deployment Guide — TaxAppeal DIY

## Overview

The app deploys as a **single Railway service** (Express API + React frontend bundled together) plus a **Railway PostgreSQL** database.

---

## Step 1: Push Code to GitHub

Push this repository to GitHub. Railway will pull from it on every commit.

---

## Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **New Project → Deploy from GitHub repo**
3. Select your `taxappeal-diy` repository
4. Railway will detect the `Dockerfile` at the root and use it automatically

---

## Step 3: Add PostgreSQL Database

1. Inside your Railway project, click **+ New**
2. Select **Database → Add PostgreSQL**
3. Railway automatically injects `DATABASE_URL` into your service environment — no manual copy needed

---

## Step 4: Set Environment Variables

In your Railway service's **Variables** tab, add:

| Variable | Value | Notes |
|---|---|---|
| `APP_URL` | `https://your-app.up.railway.app` | Your Railway public URL (set after first deploy) |
| `REPL_ID` | Your Replit App ID | Found in Replit project settings — used for Replit auth |
| `STRIPE_SECRET_KEY` | `sk_live_...` | From Stripe dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | From Stripe webhook settings |
| `VITE_GOOGLE_MAPS_KEY` | Your Google Maps API key | Optional — for address autocomplete |

> `DATABASE_URL` is injected automatically by the Railway PostgreSQL plugin.
> `PORT` is injected automatically by Railway.
> `NODE_ENV=production` is set automatically via the Dockerfile.

---

## Step 5: Configure Stripe Webhook

After your first successful deploy:

1. Copy your Railway public URL (e.g. `https://taxappeal.up.railway.app`)
2. Set `APP_URL` in Railway variables to this URL
3. In Stripe Dashboard → Webhooks, add endpoint: `https://your-app.up.railway.app/api/stripe/webhook`
4. Redeploy (or the app will auto-configure the webhook via `APP_URL`)

---

## Step 6: Auth Setup

This app uses Replit OpenID Connect for authentication. Your `REPL_ID` must match the one in your Replit project settings.

The callback URL is automatically derived from the incoming request headers on Railway (via `x-forwarded-proto` and `x-forwarded-host`), so no additional auth configuration is needed.

---

## Health Check

Railway will verify your service is healthy at: `GET /api/health`

Expected response: `{ "status": "ok", "timestamp": "..." }`

---

## Custom Domain

In Railway → your service → **Settings → Domains**, you can add a custom domain (e.g. `app.taxappealdiy.com`). After adding it, update `APP_URL` to the custom domain.
