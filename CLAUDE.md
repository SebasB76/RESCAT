@AGENTS.md

# RESCAT — Project Instructions

RESCAT is a Too Good To Go-style two-sided marketplace for Ecuador: stores publish "cajas sorpresa" (surprise boxes) of near-expiry groceries at a discount; customers ("Rescatistas") discover them by proximity, reserve in-app, pay cash-on-pickup , get a pickup code, and review after pickup

## Conventions (hard rules)

- Code in **English**. **NO comments** in any file.
- **camelCase** for code file names (e.g. `boxCard.tsx`, `reservationCode.ts`). Next.js route files stay framework-lowercase (`page.tsx`, `layout.tsx`, `[id]`).
- **UI copy and domain data in Spanish** (customers are Ecuadorian) — never translate product names/categories.
- DB columns are **camelCase, quoted in SQL** (e.g. `"stockQty"`); tables/enums lowercase.

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind v4 (CSS-first; bridged to `tailwind.config.ts` via `@config` in `app/globals.css`) · shadcn/ui (**Base UI** preset — import from `@/components/ui/*`) · Supabase (Postgres + Auth + Storage + RLS) · Leaflet + OpenStreetMap (client-only, `dynamic(ssr:false)`) · Vites t + Playwright.

## Architecture & rules

- Reads via **Server Components**; mutations via **Server Actions** in `actions/`.
- **Reservations are created ONLY via the `reserve_box` Postgres RPC** (atomic `FOR UPDATE` stock decrement + `auth.uid() = p_customer_id` identity guard + pickup-window check). Never insert into `reservation` directly — there is no INSERT policy on purpose.
- **Cajas are composed from real catalog products** via the `box_item` join (box ↔ product); `box.items[]` mirrors the product names for display. Merchant reservation reads go through the `store_reservations()` RPC (security-definer, scoped to the owner) so a store sees the reserving customer's name+phone WITHOUT opening `profile` RLS. New reservations reach the merchant live via Supabase Realtime on the `reservation` table (`components/merchantLive.tsx`, mounted in the merchant layout).
- **RLS is the authorization boundary.** Server actions use the user-session client (`lib/supabase/server.ts`), never the service_role key. service_role is only for seed / tests / cron.
- Roles: `customer` (Google + email/password) and `merchant` (email/password; `/merchant/*` gated by `middleware.ts` + `profile.role`). **Self-serve merchant signup** at `/signup` ("Soy tienda" toggle) via the `register_merchant` RPC (security-definer; elevates the caller's OWN row customer→merchant and creates the `store` atomically — the only sanctioned path that writes `role`). `profile.role` stays non-client-writable through normal grants. Admin = Supabase dashboard, no custom UI.
- Payment: `lib/payment.ts` with `cashOnPickup` (default, real) and `cardMock` (simulated). No real gateway.
- Discovery: `list_boxes_near(lat,lng)` RPC (haversine; filters active + stock>0 + pickupEnd>now) + browser Geolocation (fallback to Guayaquil center).
- Reviews are **per-box** (`review.boxId`, unique per reservation, only after `pickedUp`); `list_boxes_near` returns `boxRating`/`boxReviewCount` (with `storeRating` as fallback).

## DB / infra (critical for any DB work)

- **The direct DB host is IPv6-only and this environment has no IPv6 → use the SESSION POOLER.** The connection string is in `.env.local` as `SUPABASE_DB_URL` (`aws-0-us-east-1.pooler.supabase.com:5432`).
- Apply migrations with psql: `set -a; . ./.env.local; set +a` then `psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/NNNN.sql`. **Do NOT use `supabase link` / `db push`** (no access token available).
- **`supabase gen types` needs Docker (unavailable here) → hand-author `lib/database.types.ts`** to match the schema exactly (tables/enums + a `Functions` block for the RPCs).
- Migrations are **append-only** in `supabase/migrations/` (0001–0018 applied). Storage bucket `box-photos` is public (also reused for store logos under `stores/`).

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` · `npx tsc --noEmit`
- `npm test` — Vitest (geo, payment, reserveBox concurrency, RLS; some hit the live DB and create test rows)
- `npx playwright test` — E2E customer reserve happy path
- `npx tsx supabase/seed.ts` — base seed: stores + demo users (NOT idempotent for auth users; run once on a fresh DB)
- `npx tsx supabase/seedReal.ts` — real catalog: replaces products/lots/boxes with the real product data + rebuilds cajas from `box_item` (safe to re-run; wipes & reloads catalog + reservations)

## Demo accounts (seeded)

- Customer: `cliente@rescat.ec` / `rescat123` (or "Continuar con Google")
- Merchant: `tienda@rescat.ec` / `rescat123` (email/password only) → `/merchant`

## Secrets

`.env.local` is gitignored — never commit it. The service_role key and DB password were shared in chat during setup; rotate them before any real production use.
