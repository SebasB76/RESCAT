# RESCAT Rebanada 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a deployed, $0-hosted Too Good To Go-style MVP where a merchant publishes surprise boxes and a customer discovers them by proximity, reserves one (atomic stock), pays cash-on-pickup or via a mocked card, gets a pickup code, and reviews after pickup.

**Architecture:** Single Next.js (App Router) app on Vercel, backed by Supabase (Postgres + Auth + Storage + RLS). Reads via Server Components; mutations via Server Actions that call a transactional `reserve_box` Postgres RPC (the only path to a reservation — prevents overselling). Role-based routing: public discovery, customer login only at reservation (Google), merchant portal under `/merchant` (email+password). Proximity via a SQL haversine RPC + browser Geolocation; map via Leaflet+OSM.

**Tech Stack:** Next.js 15 (App Router, TypeScript), Tailwind CSS + shadcn/ui, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Leaflet + react-leaflet, Vitest (unit), Playwright (E2E), GitHub Actions (cron).

## Global Constraints

- **Cost:** $0 — Vercel Hobby + Supabase Free + Leaflet/OSM only. No paid services.
- **Language of code:** English identifiers. **No comments** in any file.
- **File naming:** camelCase for code files (e.g. `boxCard.tsx`, `reservationCode.ts`). Next.js route files stay framework-mandated lowercase (`page.tsx`, `layout.tsx`, `[id]`).
- **DB naming:** camelCase column names, quoted in raw SQL (e.g. `"stockQty"`). Supabase generates camelCase TS types → no mapping layer. Table names and enums are lowercase single words / `snake_case` (`user_role`).
- **UI copy & domain data:** Spanish (customers are Ecuadorian). Never translate product names/categories.
- **Design tokens ("Cosecha"):** cream `#F6EFDD`, pino `#123B29`, hoja `#5E8A31`, dorado `#E5A11C`, terracota `#CE5228` (terracota/red = urgency only). Fonts: Fraunces (display) + Hanken Grotesk (body).
- **Copy kit:** buyer = "Rescatista"; headline "Rescata comida. Ahorra. Cuida el planeta."; mission anchor "1 de cada 3 alimentos termina en la basura."
- **Reservation is created ONLY through `reserve_box` RPC.** No direct client INSERT into `reservation`.
- **Payment methods:** `cashOnPickup` (default, real) and `cardMock` (simulated). No real gateway.
- **Commit after every task** with Conventional Commit messages.

---

## File Structure

```
/ (repo root = Next app; existing prototype moved to legacy/)
  app/
    layout.tsx                     root layout, fonts, providers
    globals.css                    Tailwind + Cosecha tokens
    page.tsx                       discovery (list + map)
    login/page.tsx                 shared login (Google + email/password)
    signup/page.tsx                customer signup
    box/[id]/page.tsx              box detail + reviews
    reserve/[boxId]/page.tsx       reserve + mock payment
    reservations/page.tsx          my reservations + review
    merchant/layout.tsx            merchant guard shell
    merchant/page.tsx              dashboard (box list)
    merchant/boxes/new/page.tsx    create box
    merchant/boxes/[id]/page.tsx   edit box
    merchant/reservations/page.tsx merchant reservations + confirm pickup
    error.tsx                      global error boundary
  actions/
    boxes.ts                       createBox, updateBox
    reservations.ts                reserveBox, confirmPickup
    reviews.ts                     submitReview
  components/
    ui/                            shadcn primitives
    boxCard.tsx                    discovery/list card
    discoveryMap.tsx               Leaflet map (client-only)
    ratingStars.tsx                stars display + input
    urgencyChip.tsx                bestBefore urgency chip
    boxForm.tsx                    merchant create/edit form
  lib/
    supabase/server.ts             server client
    supabase/client.ts             browser client
    geo.ts                         distanceKm, sortByDistance
    payment.ts                     processPayment
    reservationCode.ts             formatting helpers
    database.types.ts              generated Supabase types
    types.ts                       shared domain aliases
  supabase/
    migrations/0001_schema.sql
    migrations/0002_rls.sql
    migrations/0003_functions.sql
    seed.ts
  middleware.ts                    session refresh + /merchant role guard
  tests/
    unit/geo.test.ts
    unit/payment.test.ts
    unit/reserveBox.test.ts
    e2e/customerReserve.spec.ts
    e2e/merchantConfirm.spec.ts
  .github/workflows/cron.yml       daily expire + keep-alive
  legacy/                          old prototype (reference only)
```

---

## Task 1: Scaffold Next app + Cosecha theme, deploy skeleton

**Files:**
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `tailwind.config.ts`
- Create: `legacy/` (move existing prototype into it)
- Test: manual (deployed skeleton renders themed page)

**Interfaces:**
- Produces: a running themed Next app on Vercel; Tailwind tokens `bg-cream`, `text-pino`, `text-terracota`, fonts `font-display`/`font-body`.

- [ ] **Step 1: Move the prototype out of the app root**

```bash
mkdir -p legacy
git mv index.html cliente.html rescat_data.js rescat_store.js rescat_images.js actualizar_rescat.py SampleSuperstore.xlsx legacy/ 2>/dev/null || (mv index.html cliente.html rescat_data.js rescat_store.js rescat_images.js actualizar_rescat.py SampleSuperstore.xlsx legacy/)
mv "Imágenes productos" "Caja sopresa" "Íconos" legacy/ 2>/dev/null || true
```

- [ ] **Step 2: Scaffold Next.js in place**

```bash
npx create-next-app@latest . --ts --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbopack --use-npm
```
Accept overwrite prompts. Expected: `app/`, `package.json`, `tailwind.config.ts` created.

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button input textarea card badge dialog select label sonner
```
Expected: `components/ui/*` created, `components.json` present.

- [ ] **Step 4: Add Cosecha tokens and fonts to `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F6EFDD",
        pino: "#123B29",
        hoja: "#5E8A31",
        dorado: "#E5A11C",
        terracota: "#CE5228",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-hanken)", "sans-serif"],
      },
    },
  },
  plugins: [],
}
export default config
```

- [ ] **Step 5: Wire fonts and base styles in `app/layout.tsx`**

```tsx
import type { Metadata } from "next"
import { Fraunces, Hanken_Grotesk } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" })
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" })

export const metadata: Metadata = {
  title: "RESCAT — Rescata comida. Ahorra. Cuida el planeta.",
  description: "Cajas sorpresa de tiendas de barrio en Guayaquil a precio rescate.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${hanken.variable}`}>
      <body className="min-h-screen bg-cream font-body text-pino antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Replace `app/page.tsx` with a themed landing placeholder**

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="font-display text-4xl font-semibold text-pino">
        Rescata comida. Ahorra. Cuida el planeta.
      </h1>
      <p className="mt-4 text-hoja">1 de cada 3 alimentos termina en la basura.</p>
    </main>
  )
}
```

- [ ] **Step 7: Run locally and verify theme renders**

Run: `npm run dev`
Expected: `http://localhost:3000` shows the headline in Fraunces on cream background, no console errors.

- [ ] **Step 8: Commit and deploy skeleton to Vercel**

```bash
git add -A && git commit -m "feat: scaffold Next app with Cosecha theme; move prototype to legacy"
npx vercel --yes
npx vercel --prod --yes
```
Expected: a live `*.vercel.app` URL renders the themed page.

---

## Task 2: Supabase project + typed clients + smoke test

**Files:**
- Create: `lib/supabase/server.ts`, `lib/supabase/client.ts`, `.env.local`, `.env.example`
- Create: `lib/database.types.ts` (generated later; empty stub now), `lib/types.ts`
- Test: `app/page.tsx` smoke query (temporary)

**Interfaces:**
- Produces: `createServerClient()` (server), `createBrowserClient()` (browser), typed with `Database`.

- [ ] **Step 1: Create a free Supabase project and capture keys**

Manual: create project at supabase.com (region closest to EC). Copy `Project URL`, `anon` key, `service_role` key.

- [ ] **Step 2: Write `.env.example` and `.env.local`**

`.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
Fill real values in `.env.local` (gitignored).

- [ ] **Step 3: Install Supabase packages**

```bash
npm i @supabase/supabase-js @supabase/ssr
```

- [ ] **Step 4: Stub `lib/database.types.ts` and `lib/types.ts`**

`lib/database.types.ts`:
```ts
export type Database = any
```
`lib/types.ts`:
```ts
import type { Database } from "@/lib/database.types"

export type Tables = Database extends { public: { Tables: infer T } } ? T : never
```

- [ ] **Step 5: Write server and browser clients**

`lib/supabase/server.ts`:
```ts
import { cookies } from "next/headers"
import { createServerClient as createClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

export async function createServerClient() {
  const cookieStore = await cookies()
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)),
      },
    },
  )
}
```
`lib/supabase/client.ts`:
```ts
import { createBrowserClient as createClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

export function createBrowserClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

- [ ] **Step 6: Temporary smoke query in `app/page.tsx`**

Add above the return:
```tsx
import { createServerClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createServerClient()
  const { error } = await supabase.auth.getSession()
  const status = error ? "sin conexión" : "conectado"
  return (
    <main className="mx-auto max-w-3xl px-6 py-20 text-center">
      <h1 className="font-display text-4xl font-semibold text-pino">Rescata comida. Ahorra. Cuida el planeta.</h1>
      <p className="mt-4 text-hoja">Supabase: {status}</p>
    </main>
  )
}
```

- [ ] **Step 7: Verify connection**

Run: `npm run dev`
Expected: page loads without throwing (the RPC may not exist yet; the point is the client initializes with env vars). Fix any missing-env errors.

- [ ] **Step 8: Revert the smoke query, commit**

Restore `app/page.tsx` to the Task 1 placeholder.
```bash
git add -A && git commit -m "feat: add typed Supabase server/browser clients"
```

---

## Task 3: Database schema migration

**Files:**
- Create: `supabase/migrations/0001_schema.sql`
- Test: applied schema visible in Supabase; regenerated types compile

**Interfaces:**
- Produces: tables `profile`, `store`, `box`, `reservation`, `review`; enums `user_role`, `box_status`, `payment_method`, `reservation_status`.

- [ ] **Step 1: Install Supabase CLI and link**

```bash
npm i -D supabase
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

- [ ] **Step 2: Write `supabase/migrations/0001_schema.sql`**

```sql
create type user_role as enum ('customer', 'merchant');
create type box_status as enum ('active', 'soldOut', 'expired');
create type payment_method as enum ('cashOnPickup', 'cardMock');
create type reservation_status as enum ('reserved', 'paid', 'pickedUp', 'expired', 'cancelled');

create table profile (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'customer',
  "fullName" text,
  phone text,
  "createdAt" timestamptz not null default now()
);

create table store (
  id uuid primary key default gen_random_uuid(),
  "ownerId" uuid not null references profile(id) on delete cascade,
  name text not null,
  address text not null,
  neighborhood text,
  lat double precision not null,
  lng double precision not null,
  "photoUrl" text,
  "pickupInfo" text,
  "createdAt" timestamptz not null default now()
);

create table box (
  id uuid primary key default gen_random_uuid(),
  "storeId" uuid not null references store(id) on delete cascade,
  title text not null,
  description text,
  items text[] not null default '{}',
  category text,
  "originalPrice" numeric(10,2) not null,
  price numeric(10,2) not null,
  "stockQty" int not null check ("stockQty" >= 0),
  "bestBefore" date,
  "pickupStart" timestamptz not null,
  "pickupEnd" timestamptz not null,
  "photoUrl" text,
  status box_status not null default 'active',
  "createdAt" timestamptz not null default now()
);

create table reservation (
  id uuid primary key default gen_random_uuid(),
  "boxId" uuid not null references box(id) on delete cascade,
  "customerId" uuid not null references profile(id) on delete cascade,
  code text not null unique,
  "paymentMethod" payment_method not null,
  status reservation_status not null default 'reserved',
  amount numeric(10,2) not null,
  "reservedAt" timestamptz not null default now(),
  "expiresAt" timestamptz not null,
  "pickedUpAt" timestamptz
);

create table review (
  id uuid primary key default gen_random_uuid(),
  "reservationId" uuid not null unique references reservation(id) on delete cascade,
  "storeId" uuid not null references store(id) on delete cascade,
  "customerId" uuid not null references profile(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  "createdAt" timestamptz not null default now()
);

create index on box ("storeId");
create index on box (status);
create index on reservation ("boxId");
create index on reservation ("customerId");
create index on review ("storeId");
```

- [ ] **Step 3: Apply the migration**

Run: `npx supabase db push`
Expected: migration applied; tables visible in the Supabase Table Editor.

- [ ] **Step 4: Generate TypeScript types**

Run: `npx supabase gen types typescript --linked > lib/database.types.ts`
Expected: `lib/database.types.ts` now exports a real `Database` type with the 5 tables.

- [ ] **Step 5: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0001_schema.sql lib/database.types.ts
git commit -m "feat: add database schema and generated types"
```

---

## Task 4: RLS, reserve_box RPC, expiry + geo functions (+ concurrency test)

**Files:**
- Create: `supabase/migrations/0002_rls.sql`, `supabase/migrations/0003_functions.sql`
- Test: `tests/unit/reserveBox.test.ts`

**Interfaces:**
- Produces:
  - RPC `reserve_box(p_box_id uuid, p_customer_id uuid, p_payment_method payment_method) returns reservation`
  - RPC `expire_reservations() returns int`
  - RPC `list_boxes_near(p_lat double precision, p_lng double precision) returns setof (...)`
  - trigger creating a `profile` row on new `auth.users`

- [ ] **Step 1: Write `supabase/migrations/0002_rls.sql`**

```sql
alter table profile enable row level security;
alter table store enable row level security;
alter table box enable row level security;
alter table reservation enable row level security;
alter table review enable row level security;

create policy "profile self read" on profile for select using (auth.uid() = id);
create policy "profile self insert" on profile for insert with check (auth.uid() = id);
create policy "profile self update" on profile for update using (auth.uid() = id);

create policy "store public read" on store for select using (true);
create policy "store owner write" on store for all
  using ("ownerId" = auth.uid()) with check ("ownerId" = auth.uid());

create policy "box public read" on box for select using (true);
create policy "box owner write" on box for all
  using (exists (select 1 from store s where s.id = box."storeId" and s."ownerId" = auth.uid()))
  with check (exists (select 1 from store s where s.id = box."storeId" and s."ownerId" = auth.uid()));

create policy "reservation read own or merchant" on reservation for select
  using ("customerId" = auth.uid()
    or exists (select 1 from box b join store s on s.id = b."storeId"
               where b.id = reservation."boxId" and s."ownerId" = auth.uid()));
create policy "reservation merchant update" on reservation for update
  using (exists (select 1 from box b join store s on s.id = b."storeId"
                 where b.id = reservation."boxId" and s."ownerId" = auth.uid()));

create policy "review public read" on review for select using (true);
create policy "review verified insert" on review for insert
  with check ("customerId" = auth.uid()
    and exists (select 1 from reservation r where r.id = review."reservationId"
                and r."customerId" = auth.uid() and r.status = 'pickedUp'));
```

- [ ] **Step 2: Write `supabase/migrations/0003_functions.sql`**

```sql
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profile (id, role, "fullName")
  values (new.id, 'customer', new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function reserve_box(
  p_box_id uuid, p_customer_id uuid, p_payment_method payment_method
) returns reservation
language plpgsql security definer as $$
declare
  v_box box;
  v_reservation reservation;
  v_code text;
  v_status reservation_status;
begin
  select * into v_box from box where id = p_box_id for update;
  if not found then raise exception 'box_not_found'; end if;
  if v_box.status <> 'active' or v_box."stockQty" < 1 then raise exception 'out_of_stock'; end if;

  update box set
    "stockQty" = "stockQty" - 1,
    status = case when "stockQty" - 1 = 0 then 'soldOut'::box_status else status end
  where id = p_box_id;

  v_code := 'RC-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
  v_status := case when p_payment_method = 'cardMock' then 'paid'::reservation_status else 'reserved'::reservation_status end;

  insert into reservation ("boxId", "customerId", code, "paymentMethod", status, amount, "expiresAt")
  values (p_box_id, p_customer_id, v_code, p_payment_method, v_status, v_box.price, v_box."pickupEnd")
  returning * into v_reservation;

  return v_reservation;
end; $$;

create or replace function expire_reservations() returns int
language plpgsql security definer as $$
declare v_count int;
begin
  with expired as (
    update reservation set status = 'expired'
    where status in ('reserved', 'paid') and "expiresAt" < now()
    returning "boxId"
  ), grouped as (
    select "boxId", count(*) as cnt from expired group by "boxId"
  ), restocked as (
    update box b set "stockQty" = b."stockQty" + g.cnt, status = 'active'
    from grouped g where b.id = g."boxId" returning b.id
  )
  select coalesce((select count(*) from expired), 0) into v_count;
  return v_count;
end; $$;

create or replace function list_boxes_near(p_lat double precision, p_lng double precision)
returns table (
  id uuid, "storeId" uuid, title text, price numeric, "originalPrice" numeric,
  "stockQty" int, "photoUrl" text, "bestBefore" date, "pickupEnd" timestamptz,
  "storeName" text, neighborhood text, lat double precision, lng double precision,
  "distanceKm" double precision, "storeRating" numeric
) language sql stable as $$
  select b.id, b."storeId", b.title, b.price, b."originalPrice",
    b."stockQty", b."photoUrl", b."bestBefore", b."pickupEnd",
    s.name, s.neighborhood, s.lat, s.lng,
    6371 * acos(least(1,
      cos(radians(p_lat)) * cos(radians(s.lat)) * cos(radians(s.lng) - radians(p_lng))
      + sin(radians(p_lat)) * sin(radians(s.lat)))) as "distanceKm",
    coalesce((select round(avg(r.rating), 1) from review r where r."storeId" = s.id), 0)
  from box b join store s on s.id = b."storeId"
  where b.status = 'active' and b."stockQty" > 0
  order by "distanceKm" asc;
$$;

grant execute on function reserve_box(uuid, uuid, payment_method) to authenticated;
grant execute on function list_boxes_near(double precision, double precision) to anon, authenticated;
```

- [ ] **Step 3: Apply and regenerate types**

```bash
npx supabase db push
npx supabase gen types typescript --linked > lib/database.types.ts
```
Expected: functions exist; types include the new RPCs.

- [ ] **Step 4: Write the concurrency test `tests/unit/reserveBox.test.ts`**

Install test deps first:
```bash
npm i -D vitest tsx dotenv
```
```ts
import { describe, it, expect, beforeAll } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

describe("reserve_box", () => {
  let boxId: string
  let customerId: string

  beforeAll(async () => {
    const { data: u } = await admin.auth.admin.createUser({ email: `t${Date.now()}@t.co`, password: "x1234567", email_confirm: true })
    customerId = u.user!.id
    const { data: owner } = await admin.auth.admin.createUser({ email: `o${Date.now()}@t.co`, password: "x1234567", email_confirm: true })
    const { data: store } = await admin.from("store").insert({ ownerId: owner.user!.id, name: "T", address: "A", lat: -2.17, lng: -79.9 }).select().single()
    const { data: box } = await admin.from("box").insert({ storeId: store!.id, title: "T", originalPrice: 10, price: 5, stockQty: 3, pickupStart: new Date().toISOString(), pickupEnd: new Date(Date.now() + 3600e3).toISOString() }).select().single()
    boxId = box!.id
  })

  it("never oversells under concurrency", async () => {
    const attempts = Array.from({ length: 10 }, () =>
      admin.rpc("reserve_box", { p_box_id: boxId, p_customer_id: customerId, p_payment_method: "cashOnPickup" }))
    const results = await Promise.all(attempts)
    const ok = results.filter((r) => !r.error).length
    expect(ok).toBe(3)
    const { data: box } = await admin.from("box").select("stockQty,status").eq("id", boxId).single()
    expect(box!.stockQty).toBe(0)
    expect(box!.status).toBe("soldOut")
  })
})
```

- [ ] **Step 5: Add the test script and run it**

Add to `package.json` scripts: `"test": "vitest run"`.
Run: `npx vitest run tests/unit/reserveBox.test.ts`
Expected: PASS — exactly 3 of 10 concurrent reservations succeed, stock ends at 0/`soldOut`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0002_rls.sql supabase/migrations/0003_functions.sql lib/database.types.ts tests/unit/reserveBox.test.ts package.json
git commit -m "feat: add RLS, reserve_box/expire/list_boxes_near RPCs, concurrency test"
```

---

## Task 5: Credible seed (Guayaquil stores, catalog boxes, demo accounts, reviews)

**Files:**
- Create: `supabase/seed.ts`
- Test: manual (rows visible; demo login works)

**Interfaces:**
- Consumes: admin client, `reserve_box` (for one seeded pickedUp reservation to back a review).
- Produces: 2 stores, ~8 boxes, demo customer + merchant accounts, seeded reviews.

- [ ] **Step 1: Write `supabase/seed.ts`**

```ts
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function ensureUser(email: string, password: string, role: "customer" | "merchant", fullName: string) {
  const { data } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } })
  const id = data.user!.id
  await admin.from("profile").upsert({ id, role, fullName })
  return id
}

function inDays(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString()
}
function dateInDays(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10)
}

async function main() {
  const merchantId = await ensureUser("tienda@rescat.ec", "rescat123", "merchant", "Juana Pérez")
  const customerId = await ensureUser("cliente@rescat.ec", "rescat123", "customer", "Carlos Vera")

  const stores = [
    { ownerId: merchantId, name: "Mini Market Juanita", address: "Urdesa Central, Guayaquil", neighborhood: "Urdesa", lat: -2.1710, lng: -79.9020, pickupInfo: "Retiro en caja, mostrar código" },
    { ownerId: merchantId, name: "Despensa Doña María", address: "Alborada 6ta etapa, Guayaquil", neighborhood: "Alborada", lat: -2.1180, lng: -79.9010, pickupInfo: "Retiro en el mostrador" },
  ]
  const { data: insertedStores } = await admin.from("store").upsert(stores).select()

  const boxesByStore = (storeId: string) => [
    { storeId, title: "Caja Desayuno", description: "Pan, leche y galletas del día", items: ["Pan de Molde Blanco (Supan)", "Leche Entera 1L (Toni)", "Galletas de Chocolate (Oreo)"], category: "Desayuno", originalPrice: 5.02, price: 2.25, stockQty: 6, bestBefore: dateInDays(3), pickupStart: inDays(0), pickupEnd: inDays(1) },
    { storeId, title: "Panadería del día", description: "Panes surtidos horneados hoy", items: ["Pan Integral (Bimbo)", "Pan de Molde Blanco (Supan)"], category: "Panadería", originalPrice: 3.76, price: 1.90, stockQty: 4, bestBefore: dateInDays(2), pickupStart: inDays(0), pickupEnd: inDays(1) },
    { storeId, title: "Frutas & Verduras", description: "Frescos por consumir pronto", items: ["Tomate Riñón 1kg", "Cebolla Paiteña 1kg", "Plátano Verde x5"], category: "Frutas y Verduras", originalPrice: 3.10, price: 1.40, stockQty: 5, bestBefore: dateInDays(4), pickupStart: inDays(0), pickupEnd: inDays(1) },
    { storeId, title: "Lácteos por vencer", description: "Lácteos frescos a precio rescate", items: ["Leche Descremada 1L (Reyleche)", "Queso Fresco 500g (Kiosko)", "Media Cubeta de Huevos x15 (Indaves)"], category: "Lácteos y Huevos", originalPrice: 9.13, price: 4.55, stockQty: 3, bestBefore: dateInDays(5), pickupStart: inDays(0), pickupEnd: inDays(2) },
  ]
  const allBoxes = insertedStores!.flatMap((s) => boxesByStore(s.id))
  const { data: insertedBoxes } = await admin.from("box").insert(allBoxes).select()

  const firstBox = insertedBoxes![0]
  const { data: res } = await admin.rpc("reserve_box", { p_box_id: firstBox.id, p_customer_id: customerId, p_payment_method: "cashOnPickup" })
  await admin.from("reservation").update({ status: "pickedUp", pickedUpAt: new Date().toISOString() }).eq("id", res!.id)
  await admin.from("review").insert({ reservationId: res!.id, storeId: firstBox.storeId, customerId, rating: 5, comment: "Excelente, todo fresquito y baratísimo. Vuelvo mañana." })

  console.log("seed done")
}
main()
```

- [ ] **Step 2: Run the seed**

Run: `npx tsx supabase/seed.ts`
Expected: prints "seed done"; Table Editor shows 2 stores, 8 boxes, 1 pickedUp reservation, 1 review; demo users exist in Auth.

- [ ] **Step 3: Verify demo data reads via the anon path**

Run: `npx tsx -e "import('@supabase/supabase-js').then(async({createClient})=>{const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);const{data}=await c.rpc('list_boxes_near',{p_lat:-2.17,p_lng:-79.9});console.log(data?.length,'cajas')})" ` (env from shell)
Expected: prints "8 cajas" ordered by distance.

- [ ] **Step 4: Commit**

```bash
git add supabase/seed.ts && git commit -m "feat: add credible Guayaquil seed with demo accounts and reviews"
```

---

## Task 6: Auth — Google (customer) + email/password (merchant) + role guard

**Files:**
- Create: `middleware.ts`, `app/auth/callback/route.ts`, `app/login/page.tsx`, `app/signup/page.tsx`
- Test: manual guard verification with demo accounts

**Interfaces:**
- Consumes: `createServerClient`, `createBrowserClient`, `profile.role`.
- Produces: authenticated sessions; `/merchant/*` gated to `role=merchant`; `/reserve|/reservations` gated to any signed-in user.

- [ ] **Step 1: Enable providers in Supabase (manual)**

In Supabase Auth settings: enable Email provider; enable Google provider (create Google Cloud OAuth client, set authorized redirect `https://<project>.supabase.co/auth/v1/callback`). Add site URL + `http://localhost:3000` and the Vercel URL to redirect allow-list.

- [ ] **Step 2: Write `app/auth/callback/route.ts`**

```ts
import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const next = url.searchParams.get("next") ?? "/"
  if (code) {
    const supabase = await createServerClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(new URL(next, url.origin))
}
```

- [ ] **Step 3: Write `middleware.ts`**

```ts
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )
  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  if (path.startsWith("/merchant")) {
    if (!user) return NextResponse.redirect(new URL("/login?next=/merchant", request.url))
    const { data: profile } = await supabase.from("profile").select("role").eq("id", user.id).single()
    if (profile?.role !== "merchant") return NextResponse.redirect(new URL("/", request.url))
  }
  if ((path.startsWith("/reserve") || path.startsWith("/reservations")) && !user) {
    return NextResponse.redirect(new URL(`/login?next=${path}`, request.url))
  }
  return response
}

export const config = { matcher: ["/merchant/:path*", "/reserve/:path*", "/reservations/:path*"] }
```

- [ ] **Step 4: Write `app/login/page.tsx`**

```tsx
"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginPage() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const next = useSearchParams().get("next") ?? "/"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${next}` } })
  }
  async function emailLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return toast.error("Correo o contraseña incorrectos")
    router.push(next)
    router.refresh()
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl text-pino">Entrar a RESCAT</h1>
      <Button onClick={google} className="mt-6 w-full bg-pino">Continuar con Google</Button>
      <div className="my-4 text-center text-sm text-hoja">o con tu correo</div>
      <form onSubmit={emailLogin} className="space-y-3">
        <div><Label>Correo</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></div>
        <div><Label>Contraseña</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></div>
        <Button type="submit" variant="outline" className="w-full">Entrar</Button>
      </form>
    </main>
  )
}
```

- [ ] **Step 5: Write `app/signup/page.tsx`**

```tsx
"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SignupPage() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } })
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) return toast.error(error.message)
    toast.success("Cuenta creada")
    router.push("/")
    router.refresh()
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl text-pino">Crear cuenta</h1>
      <Button onClick={google} className="mt-6 w-full bg-pino">Continuar con Google</Button>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div><Label>Nombre</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
        <div><Label>Correo</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></div>
        <div><Label>Contraseña</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></div>
        <Button type="submit" variant="outline" className="w-full">Registrarme</Button>
      </form>
    </main>
  )
}
```

- [ ] **Step 6: Verify guard behavior**

Run: `npm run dev`. Log in with `cliente@rescat.ec / rescat123`, visit `/merchant` → redirected to `/`. Log out, log in with `tienda@rescat.ec / rescat123`, visit `/merchant` → allowed. Visit `/reservations` while logged out → redirected to `/login`.
Expected: all three redirects behave as described.

- [ ] **Step 7: Commit**

```bash
git add middleware.ts app/auth app/login app/signup
git commit -m "feat: add auth (Google + email/password) with role-based route guard"
```

---

## Task 7: Merchant shell + dashboard (box list)

**Files:**
- Create: `app/merchant/layout.tsx`, `app/merchant/page.tsx`
- Test: manual (merchant sees only their boxes)

**Interfaces:**
- Consumes: `store` by `ownerId`, `box` by `storeId`.
- Produces: merchant nav shell; box list linking to `/merchant/boxes/[id]`.

- [ ] **Step 1: Write `app/merchant/layout.tsx`**

```tsx
import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/merchant")
  const { data: profile } = await supabase.from("profile").select("role").eq("id", user.id).single()
  if (profile?.role !== "merchant") redirect("/")
  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-between border-b border-pino/10 bg-white px-6 py-3">
        <span className="font-display text-lg text-pino">RESCAT · Panel</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/merchant">Mis cajas</Link>
          <Link href="/merchant/reservations">Reservas</Link>
          <Link href="/merchant/boxes/new" className="text-hoja">+ Nueva caja</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Write `app/merchant/page.tsx`**

```tsx
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"

export default async function MerchantDashboard() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user!.id)
  const storeIds = (stores ?? []).map((s) => s.id)
  const { data: boxes } = await supabase.from("box").select("*")
    .in("storeId", storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"])
    .order("createdAt", { ascending: false })

  return (
    <div>
      <h1 className="font-display text-2xl text-pino">Mis cajas</h1>
      {!boxes?.length && <p className="mt-4 text-hoja">Aún no tienes cajas. Crea la primera.</p>}
      <div className="mt-6 grid gap-3">
        {boxes?.map((b) => (
          <Link key={b.id} href={`/merchant/boxes/${b.id}`} className="rounded-xl border border-pino/10 bg-white p-4">
            <div className="flex justify-between">
              <span className="font-medium">{b.title}</span>
              <span className="text-sm text-hoja">${b.price} · stock {b.stockQty} · {b.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`, log in as `tienda@rescat.ec`, visit `/merchant`.
Expected: the 8 seeded boxes appear, newest first.

- [ ] **Step 4: Commit**

```bash
git add app/merchant/layout.tsx app/merchant/page.tsx
git commit -m "feat: add merchant shell and dashboard box list"
```

---

## Task 8: Create/edit box + image upload

**Files:**
- Create: `actions/boxes.ts`, `components/boxForm.tsx`, `app/merchant/boxes/new/page.tsx`, `app/merchant/boxes/[id]/page.tsx`
- Test: manual (publish a box, edit it, upload a photo)

**Interfaces:**
- Consumes: Storage bucket `box-photos` (public).
- Produces: `createBox(input)`, `updateBox(id, input)` server actions; `BoxForm` component. `input` shape: `{ title: string; description: string; items: string[]; category: string; originalPrice: number; price: number; stockQty: number; bestBefore: string; pickupStart: string; pickupEnd: string; photoUrl: string | null }`.

- [ ] **Step 1: Create the public Storage bucket (manual)**

In Supabase Storage: create bucket `box-photos`, set Public. Add a policy allowing authenticated users to insert objects.

- [ ] **Step 2: Write `actions/boxes.ts`**

```ts
"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export type BoxInput = {
  title: string; description: string; items: string[]; category: string
  originalPrice: number; price: number; stockQty: number
  bestBefore: string; pickupStart: string; pickupEnd: string; photoUrl: string | null
}

export async function createBox(input: BoxInput) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: store } = await supabase.from("store").select("id").eq("ownerId", user!.id).limit(1).single()
  const { error } = await supabase.from("box").insert({ ...input, storeId: store!.id, status: "active" })
  if (error) throw new Error(error.message)
  revalidatePath("/merchant")
  redirect("/merchant")
}

export async function updateBox(id: string, input: BoxInput) {
  const supabase = await createServerClient()
  const { error } = await supabase.from("box").update(input).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/merchant")
  redirect("/merchant")
}
```

- [ ] **Step 3: Write `components/boxForm.tsx`**

```tsx
"use client"
import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { BoxInput } from "@/actions/boxes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export type BoxFormValues = {
  title: string; description: string; items: string; category: string
  originalPrice: string; price: string; stockQty: string
  bestBefore: string; pickupStart: string; pickupEnd: string; photoUrl: string | null
}

export function BoxForm({ initial, onSubmit }: { initial: BoxFormValues; onSubmit: (input: BoxInput) => Promise<void> }) {
  const supabase = createBrowserClient()
  const [v, setV] = useState<BoxFormValues>(initial)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof BoxFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value })

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from("box-photos").upload(path, file, { upsert: true })
    if (error) return toast.error("No se pudo subir la imagen; puedes guardar sin foto")
    setV({ ...v, photoUrl: supabase.storage.from("box-photos").getPublicUrl(path).data.publicUrl })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSubmit({
        title: v.title, description: v.description, category: v.category,
        items: v.items.split("\n").map((s) => s.trim()).filter(Boolean),
        originalPrice: Number(v.originalPrice), price: Number(v.price), stockQty: Number(v.stockQty),
        bestBefore: v.bestBefore, pickupStart: v.pickupStart, pickupEnd: v.pickupEnd, photoUrl: v.photoUrl,
      })
    } catch {
      toast.error("No se pudo guardar")
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-3">
      <div><Label>Título</Label><Input value={v.title} onChange={set("title")} required /></div>
      <div><Label>Descripción</Label><Textarea value={v.description} onChange={set("description")} /></div>
      <div><Label>Ítems (uno por línea)</Label><Textarea value={v.items} onChange={set("items")} /></div>
      <div><Label>Categoría</Label><Input value={v.category} onChange={set("category")} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Precio original</Label><Input value={v.originalPrice} onChange={set("originalPrice")} type="number" step="0.01" required /></div>
        <div><Label>Precio rescate</Label><Input value={v.price} onChange={set("price")} type="number" step="0.01" required /></div>
        <div><Label>Stock</Label><Input value={v.stockQty} onChange={set("stockQty")} type="number" required /></div>
      </div>
      <div><Label>Consumir antes de</Label><Input value={v.bestBefore} onChange={set("bestBefore")} type="date" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Pickup desde</Label><Input value={v.pickupStart} onChange={set("pickupStart")} type="datetime-local" required /></div>
        <div><Label>Pickup hasta</Label><Input value={v.pickupEnd} onChange={set("pickupEnd")} type="datetime-local" required /></div>
      </div>
      <div><Label>Foto</Label><Input type="file" accept="image/*" onChange={upload} /></div>
      <Button type="submit" disabled={busy} className="bg-pino">{busy ? "Guardando…" : "Guardar caja"}</Button>
    </form>
  )
}
```

- [ ] **Step 4: Write `app/merchant/boxes/new/page.tsx`**

```tsx
import { BoxForm } from "@/components/boxForm"
import { createBox, type BoxInput } from "@/actions/boxes"

export default function NewBoxPage() {
  async function onSubmit(input: BoxInput) {
    "use server"
    await createBox(input)
  }
  return (
    <div>
      <h1 className="font-display text-2xl text-pino">Nueva caja</h1>
      <div className="mt-6">
        <BoxForm
          initial={{ title: "", description: "", items: "", category: "", originalPrice: "", price: "", stockQty: "", bestBefore: "", pickupStart: "", pickupEnd: "", photoUrl: null }}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write `app/merchant/boxes/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation"
import { BoxForm } from "@/components/boxForm"
import { updateBox, type BoxInput } from "@/actions/boxes"
import { createServerClient } from "@/lib/supabase/server"

export default async function EditBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: b } = await supabase.from("box").select("*").eq("id", id).single()
  if (!b) notFound()

  async function onSubmit(input: BoxInput) {
    "use server"
    await updateBox(id, input)
  }
  return (
    <div>
      <h1 className="font-display text-2xl text-pino">Editar caja</h1>
      <div className="mt-6">
        <BoxForm
          initial={{
            title: b.title, description: b.description ?? "", items: (b.items ?? []).join("\n"),
            category: b.category ?? "", originalPrice: String(b.originalPrice), price: String(b.price),
            stockQty: String(b.stockQty), bestBefore: b.bestBefore ?? "",
            pickupStart: b.pickupStart.slice(0, 16), pickupEnd: b.pickupEnd.slice(0, 16), photoUrl: b.photoUrl,
          }}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Verify**

Run: `npm run dev`, as merchant create a box with a photo, then edit it.
Expected: new box appears on `/merchant`; photo displays; edits persist.

- [ ] **Step 7: Commit**

```bash
git add actions/boxes.ts components/boxForm.tsx app/merchant/boxes
git commit -m "feat: add create/edit box with image upload"
```

---

## Task 9: Merchant reservations + confirm pickup

**Files:**
- Create: `actions/reservations.ts`, `app/merchant/reservations/page.tsx`
- Test: manual (confirm a reservation → status pickedUp)

**Interfaces:**
- Produces: `confirmPickup(reservationId: string)` server action.

- [ ] **Step 1: Write `actions/reservations.ts` (confirmPickup)**

```ts
"use server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function confirmPickup(reservationId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from("reservation")
    .update({ status: "pickedUp", pickedUpAt: new Date().toISOString() })
    .eq("id", reservationId)
  if (error) throw new Error(error.message)
  revalidatePath("/merchant/reservations")
}
```

- [ ] **Step 2: Write `app/merchant/reservations/page.tsx`**

```tsx
import { createServerClient } from "@/lib/supabase/server"
import { confirmPickup } from "@/actions/reservations"
import { Button } from "@/components/ui/button"

export default async function MerchantReservations() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user!.id)
  const storeIds = (stores ?? []).map((s) => s.id)
  const { data: rows } = await supabase
    .from("reservation")
    .select("id,code,status,amount,paymentMethod,box!inner(title,storeId)")
    .in("box.storeId", storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"])
    .order("reservedAt", { ascending: false })

  async function confirm(formData: FormData) {
    "use server"
    await confirmPickup(String(formData.get("id")))
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-pino">Reservas</h1>
      <div className="mt-6 grid gap-3">
        {rows?.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-pino/10 bg-white p-4">
            <div>
              <div className="font-mono font-medium">{r.code}</div>
              <div className="text-sm text-hoja">
                {(r.box as { title: string }).title} · ${r.amount} · {r.paymentMethod === "cashOnPickup" ? "efectivo" : "tarjeta"} · {r.status}
              </div>
            </div>
            {r.status !== "pickedUp" && (
              <form action={confirm}>
                <input type="hidden" name="id" value={r.id} />
                <Button className="bg-hoja">Marcar retirado</Button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run: create a reservation as customer (after Task 13), return here as merchant, click "Marcar retirado".
Expected: status flips to `pickedUp`; button disappears.

- [ ] **Step 4: Commit**

```bash
git add actions/reservations.ts app/merchant/reservations/page.tsx
git commit -m "feat: add merchant reservations list and confirm pickup"
```

---

## Task 10: Geo helper + discovery (list, geolocation, distance sort)

**Files:**
- Create: `vitest.config.ts`, `lib/geo.ts`, `components/urgencyChip.tsx`, `components/boxCard.tsx`
- Modify: `app/page.tsx`
- Test: `tests/unit/geo.test.ts`

**Interfaces:**
- Produces: `distanceKm(lat1,lng1,lat2,lng2): number`; `DiscoveryBox` type (`{ id: string; title: string; price: number; originalPrice: number; photoUrl: string | null; bestBefore: string | null; storeName: string; neighborhood: string | null; lat: number; lng: number; distanceKm: number; storeRating: number }`); consumes RPC `list_boxes_near`.

- [ ] **Step 1: Write `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config"
import path from "path"

export default defineConfig({
  test: { environment: "node" },
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
})
```

- [ ] **Step 2: Write the failing test `tests/unit/geo.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import { distanceKm } from "@/lib/geo"

describe("distanceKm", () => {
  it("is ~0 for the same point", () => {
    expect(distanceKm(-2.17, -79.9, -2.17, -79.9)).toBeCloseTo(0, 5)
  })
  it("computes Urdesa↔Alborada as ~6km", () => {
    const d = distanceKm(-2.171, -79.902, -2.118, -79.901)
    expect(d).toBeGreaterThan(5)
    expect(d).toBeLessThan(7)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/geo.test.ts`
Expected: FAIL — cannot resolve `@/lib/geo`.

- [ ] **Step 4: Write `lib/geo.ts`**

```ts
export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/geo.test.ts`
Expected: PASS.

- [ ] **Step 6: Write `components/urgencyChip.tsx`**

```tsx
export function UrgencyChip({ bestBefore }: { bestBefore: string | null }) {
  if (!bestBefore) return null
  const days = Math.ceil((new Date(bestBefore).getTime() - Date.now()) / 86400000)
  const urgent = days <= 2
  const label = days <= 1 ? "¡Hoy!" : `${days} días`
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgent ? "bg-terracota text-white" : "bg-dorado/20 text-pino"}`}>
      Consumir antes de · {label}
    </span>
  )
}
```

- [ ] **Step 7: Write `components/boxCard.tsx`**

```tsx
import Link from "next/link"
import { UrgencyChip } from "@/components/urgencyChip"

export type DiscoveryBox = {
  id: string; title: string; price: number; originalPrice: number
  photoUrl: string | null; bestBefore: string | null; storeName: string
  neighborhood: string | null; lat: number; lng: number; distanceKm: number; storeRating: number
}

export function BoxCard({ box }: { box: DiscoveryBox }) {
  const off = Math.round((1 - box.price / box.originalPrice) * 100)
  return (
    <Link href={`/box/${box.id}`} className="overflow-hidden rounded-2xl border border-pino/10 bg-white shadow-sm">
      <div className="relative h-40 bg-cream">
        {box.photoUrl && <img src={box.photoUrl} alt={box.title} className="h-full w-full object-cover" />}
        <span className="absolute right-2 top-2 rounded-full bg-terracota px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-pino">{box.title}</h3>
          <span className="text-sm text-dorado">★ {box.storeRating}</span>
        </div>
        <p className="text-sm text-hoja">{box.storeName} · {box.neighborhood} · {box.distanceKm.toFixed(1)} km</p>
        <div className="flex items-center justify-between pt-1">
          <UrgencyChip bestBefore={box.bestBefore} />
          <span><span className="text-sm text-pino/50 line-through">${box.originalPrice}</span> <span className="font-display text-lg text-pino">${box.price}</span></span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 8: Replace `app/page.tsx` with the discovery list**

```tsx
"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { BoxCard, type DiscoveryBox } from "@/components/boxCard"

const GYE = { lat: -2.1709, lng: -79.9224 }

export default function Home() {
  const supabase = createBrowserClient()
  const [boxes, setBoxes] = useState<DiscoveryBox[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    function load(lat: number, lng: number) {
      supabase.rpc("list_boxes_near", { p_lat: lat, p_lng: lng }).then(({ data }) => {
        setBoxes((data as DiscoveryBox[]) ?? [])
        setLoading(false)
      })
    }
    if (!navigator.geolocation) { setDenied(true); load(GYE.lat, GYE.lng); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => { setDenied(true); load(GYE.lat, GYE.lng) },
    )
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-pino">Rescata comida cerca de ti</h1>
          {denied && <p className="text-sm text-hoja">Mostrando cajas en Guayaquil (activa tu ubicación para ver las más cercanas).</p>}
        </div>
        <Link href="/login" className="text-sm text-pino underline">Entrar</Link>
      </div>
      {loading ? <p className="mt-10 text-center text-hoja">Buscando cajas…</p>
        : boxes.length === 0 ? <p className="mt-10 text-center text-hoja">No hay cajas disponibles ahora mismo.</p>
        : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{boxes.map((b) => <BoxCard key={b.id} box={b} />)}</div>}
    </main>
  )
}
```

- [ ] **Step 9: Verify**

Run: `npm run dev`, open `/`, allow location.
Expected: seeded boxes render as cards, nearest first, with discount badge, store rating, urgency chip.

- [ ] **Step 10: Commit**

```bash
git add vitest.config.ts lib/geo.ts tests/unit/geo.test.ts components/urgencyChip.tsx components/boxCard.tsx app/page.tsx
git commit -m "feat: add proximity discovery list with distance sort"
```

---

## Task 11: Map view (Leaflet + OSM) with list/map toggle

**Files:**
- Create: `components/discoveryMap.tsx`
- Modify: `app/page.tsx`
- Test: manual (map shows pins, toggle works)

**Interfaces:**
- Consumes: `DiscoveryBox` (uses `lat`, `lng`).
- Produces: default-exported `DiscoveryMap` (client-only).

- [ ] **Step 1: Install Leaflet**

```bash
npm i leaflet react-leaflet
npm i -D @types/leaflet
```

- [ ] **Step 2: Write `components/discoveryMap.tsx`**

```tsx
"use client"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import type { DiscoveryBox } from "@/components/boxCard"

const pin = L.divIcon({
  className: "",
  html: '<div style="background:#CE5228;width:14px;height:14px;border-radius:50%;border:2px solid white"></div>',
  iconSize: [14, 14],
})

export default function DiscoveryMap({ boxes, center }: { boxes: DiscoveryBox[]; center: { lat: number; lng: number } }) {
  return (
    <MapContainer center={[center.lat, center.lng]} zoom={13} className="h-[70vh] w-full rounded-2xl">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
      {boxes.map((b) => (
        <Marker key={b.id} position={[b.lat, b.lng]} icon={pin}>
          <Popup>
            <a href={`/box/${b.id}`} className="font-medium">{b.title}</a><br />
            {b.storeName} · ${b.price}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

- [ ] **Step 3: Add the toggle to `app/page.tsx`**

Replace the file with the version below (adds `view` state, dynamic map import, toggle buttons):
```tsx
"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@/lib/supabase/client"
import { BoxCard, type DiscoveryBox } from "@/components/boxCard"
import { Button } from "@/components/ui/button"

const DiscoveryMap = dynamic(() => import("@/components/discoveryMap"), { ssr: false })
const GYE = { lat: -2.1709, lng: -79.9224 }

export default function Home() {
  const supabase = createBrowserClient()
  const [boxes, setBoxes] = useState<DiscoveryBox[]>([])
  const [center, setCenter] = useState(GYE)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [view, setView] = useState<"list" | "map">("list")

  useEffect(() => {
    function load(lat: number, lng: number) {
      setCenter({ lat, lng })
      supabase.rpc("list_boxes_near", { p_lat: lat, p_lng: lng }).then(({ data }) => {
        setBoxes((data as DiscoveryBox[]) ?? [])
        setLoading(false)
      })
    }
    if (!navigator.geolocation) { setDenied(true); load(GYE.lat, GYE.lng); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => { setDenied(true); load(GYE.lat, GYE.lng) },
    )
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-pino">Rescata comida cerca de ti</h1>
          {denied && <p className="text-sm text-hoja">Mostrando cajas en Guayaquil (activa tu ubicación para ver las más cercanas).</p>}
        </div>
        <Link href="/login" className="text-sm text-pino underline">Entrar</Link>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")} className={view === "list" ? "bg-pino" : ""}>Lista</Button>
        <Button variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")} className={view === "map" ? "bg-pino" : ""}>Mapa</Button>
      </div>
      {loading ? <p className="mt-10 text-center text-hoja">Buscando cajas…</p>
        : boxes.length === 0 ? <p className="mt-10 text-center text-hoja">No hay cajas disponibles ahora mismo.</p>
        : view === "list"
          ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{boxes.map((b) => <BoxCard key={b.id} box={b} />)}</div>
          : <div className="mt-6"><DiscoveryMap boxes={boxes} center={center} /></div>}
    </main>
  )
}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`, toggle to Mapa.
Expected: OSM map with terracota pins at store locations; clicking a pin shows a popup linking to the box.

- [ ] **Step 5: Commit**

```bash
git add components/discoveryMap.tsx app/page.tsx package.json
git commit -m "feat: add Leaflet/OSM map view with list toggle"
```

---

## Task 12: Box detail + reviews

**Files:**
- Create: `components/ratingStars.tsx`, `app/box/[id]/page.tsx`
- Test: manual (detail shows items, rating, reviews; Reservar visible when in stock)

**Interfaces:**
- Produces: `RatingStars({ value, onChange? })`; box detail page reading `box + store` and `review` by `storeId`.

- [ ] **Step 1: Write `components/ratingStars.tsx`**

```tsx
"use client"
export function RatingStars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1 text-lg">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)}
          className={n <= value ? "text-dorado" : "text-pino/20"}>★</button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `app/box/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { UrgencyChip } from "@/components/urgencyChip"
import { Button } from "@/components/ui/button"

export default async function BoxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: box } = await supabase.from("box").select("*, store(id,name,address,neighborhood)").eq("id", id).single()
  if (!box) notFound()
  const store = box.store as { id: string; name: string; address: string; neighborhood: string | null }
  const { data: reviews } = await supabase.from("review").select("rating,comment").eq("storeId", store.id).order("createdAt", { ascending: false }).limit(10)
  const avg = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—"
  const off = Math.round((1 - box.price / box.originalPrice) * 100)
  const soldOut = box.status !== "active" || box.stockQty < 1

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <div className="overflow-hidden rounded-2xl bg-white">
        {box.photoUrl && <img src={box.photoUrl} alt={box.title} className="h-64 w-full object-cover" />}
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl text-pino">{box.title}</h1>
            <span className="rounded-full bg-terracota px-2 py-0.5 text-sm font-bold text-white">-{off}%</span>
          </div>
          <p className="text-hoja">{store.name} · {store.neighborhood} · {store.address}</p>
          <UrgencyChip bestBefore={box.bestBefore} />
          {box.description && <p>{box.description}</p>}
          {!!box.items?.length && <ul className="list-disc pl-5 text-sm text-pino/80">{box.items.map((it, i) => <li key={i}>{it}</li>)}</ul>}
          <div className="flex items-center justify-between pt-2">
            <span><span className="text-pino/50 line-through">${box.originalPrice}</span> <span className="font-display text-2xl text-pino">${box.price}</span></span>
            {soldOut ? <span className="font-semibold text-terracota">Agotado</span>
              : <Link href={`/reserve/${box.id}`}><Button className="bg-pino">Reservar</Button></Link>}
          </div>
        </div>
      </div>
      <section className="mt-6">
        <h2 className="font-display text-lg text-pino">Reseñas · ★ {avg}</h2>
        <div className="mt-3 space-y-3">
          {reviews?.map((r, i) => (
            <div key={i} className="rounded-xl border border-pino/10 bg-white p-3">
              <div className="text-dorado">{"★".repeat(r.rating)}</div>
              {r.comment && <p className="text-sm text-pino/80">{r.comment}</p>}
            </div>
          ))}
          {!reviews?.length && <p className="text-sm text-hoja">Aún sin reseñas.</p>}
        </div>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Verify**

Run: open a seeded box; the store with the seeded review shows ★ 5.0 and the comment.
Expected: items listed, price/discount shown, Reservar present for in-stock boxes.

- [ ] **Step 4: Commit**

```bash
git add components/ratingStars.tsx app/box/[id]/page.tsx
git commit -m "feat: add box detail with items and store reviews"
```

---

## Task 13: Reserve flow + mock payment

**Files:**
- Create: `lib/payment.ts`, `app/reserve/[boxId]/page.tsx`
- Modify: `actions/reservations.ts` (add `reserveBox`)
- Test: `tests/unit/payment.test.ts`

**Interfaces:**
- Consumes: RPC `reserve_box`.
- Produces: `processPayment(method, amount)`; `reserveBox(boxId, paymentMethod)` server action returning the created `reservation` (has `.code`). `PaymentMethod = "cashOnPickup" | "cardMock"`.

- [ ] **Step 1: Write the failing test `tests/unit/payment.test.ts`**

```ts
import { describe, it, expect } from "vitest"
import { processPayment } from "@/lib/payment"

describe("processPayment", () => {
  it("cashOnPickup approves immediately", async () => {
    expect(await processPayment("cashOnPickup", 5)).toEqual({ ok: true })
  })
  it("cardMock approves a positive amount", async () => {
    expect(await processPayment("cardMock", 5)).toEqual({ ok: true })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/payment.test.ts`
Expected: FAIL — cannot resolve `@/lib/payment`.

- [ ] **Step 3: Write `lib/payment.ts`**

```ts
export type PaymentMethod = "cashOnPickup" | "cardMock"

export async function processPayment(method: PaymentMethod, amount: number): Promise<{ ok: boolean }> {
  if (method === "cashOnPickup") return { ok: true }
  await new Promise((r) => setTimeout(r, 1000))
  return { ok: amount > 0 }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/payment.test.ts`
Expected: PASS.

- [ ] **Step 5: Add `reserveBox` to `actions/reservations.ts`**

Prepend the import and append the action (keep the existing `confirmPickup`):
```ts
import type { PaymentMethod } from "@/lib/payment"

export async function reserveBox(boxId: string, paymentMethod: PaymentMethod) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { data, error } = await supabase.rpc("reserve_box", {
    p_box_id: boxId, p_customer_id: user.id, p_payment_method: paymentMethod,
  })
  if (error) throw new Error(error.message.includes("out_of_stock") ? "out_of_stock" : error.message)
  revalidatePath("/")
  return data
}
```

- [ ] **Step 6: Write `app/reserve/[boxId]/page.tsx`**

```tsx
"use client"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { reserveBox } from "@/actions/reservations"
import { processPayment, type PaymentMethod } from "@/lib/payment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function ReservePage({ params }: { params: Promise<{ boxId: string }> }) {
  const { boxId } = use(params)
  const supabase = createBrowserClient()
  const router = useRouter()
  const [box, setBox] = useState<{ title: string; price: number } | null>(null)
  const [method, setMethod] = useState<PaymentMethod>("cashOnPickup")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from("box").select("title,price").eq("id", boxId).single().then(({ data }) => setBox(data))
  }, [boxId])

  async function confirm() {
    if (!box) return
    setBusy(true)
    const pay = await processPayment(method, box.price)
    if (!pay.ok) { toast.error("El pago no se pudo procesar"); setBusy(false); return }
    try {
      const reservation = await reserveBox(boxId, method)
      router.push(`/reservations?code=${reservation.code}`)
    } catch (e) {
      toast.error(e instanceof Error && e.message === "out_of_stock" ? "Se agotó justo ahora 😔" : "No se pudo reservar")
      setBusy(false)
    }
  }

  if (!box) return <main className="p-10 text-center text-hoja">Cargando…</main>
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="font-display text-2xl text-pino">Reservar</h1>
      <div className="mt-4 rounded-xl bg-white p-4">
        <div className="flex justify-between"><span>{box.title}</span><span className="font-display text-lg">${box.price}</span></div>
      </div>
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2"><input type="radio" checked={method === "cashOnPickup"} onChange={() => setMethod("cashOnPickup")} /> Pagar en efectivo al retirar</label>
        <label className="flex items-center gap-2"><input type="radio" checked={method === "cardMock"} onChange={() => setMethod("cardMock")} /> Pagar con tarjeta</label>
      </div>
      {method === "cardMock" && (
        <div className="mt-3 space-y-2 rounded-xl border border-pino/10 bg-white p-3">
          <Input placeholder="Número de tarjeta" />
          <div className="grid grid-cols-2 gap-2"><Input placeholder="MM/AA" /><Input placeholder="CVV" /></div>
          <p className="text-xs text-hoja">Pago simulado — no se realiza ningún cobro real.</p>
        </div>
      )}
      <Button onClick={confirm} disabled={busy} className="mt-4 w-full bg-pino">{busy ? "Procesando…" : "Confirmar reserva"}</Button>
    </main>
  )
}
```

- [ ] **Step 7: Verify**

Run: as `cliente@rescat.ec`, reserve a box with each payment method.
Expected: redirect to `/reservations?code=RC-XXXXXX`; stock decremented in `/merchant`.

- [ ] **Step 8: Commit**

```bash
git add lib/payment.ts tests/unit/payment.test.ts actions/reservations.ts app/reserve/[boxId]/page.tsx
git commit -m "feat: add reserve flow with mock payment and atomic reserveBox"
```

---

## Task 14: My reservations + submit review

**Files:**
- Create: `actions/reviews.ts`, `components/reviewForm.tsx`, `app/reservations/page.tsx`
- Test: manual (after pickup, submit a review; it appears on box detail)

**Interfaces:**
- Produces: `submitReview(reservationId, storeId, rating, comment)` server action; `ReviewForm` component.

- [ ] **Step 1: Write `actions/reviews.ts`**

```ts
"use server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function submitReview(reservationId: string, storeId: string, rating: number, comment: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { error } = await supabase.from("review").insert({ reservationId, storeId, customerId: user.id, rating, comment })
  if (error) throw new Error(error.message)
  revalidatePath("/reservations")
}
```

- [ ] **Step 2: Write `components/reviewForm.tsx`**

```tsx
"use client"
import { useState } from "react"
import { submitReview } from "@/actions/reviews"
import { RatingStars } from "@/components/ratingStars"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function ReviewForm({ reservationId, storeId }: { reservationId: string; storeId: string }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [done, setDone] = useState(false)

  async function submit() {
    try {
      await submitReview(reservationId, storeId, rating, comment)
      setDone(true)
      toast.success("¡Gracias por tu reseña!")
    } catch {
      toast.error("No se pudo enviar la reseña")
    }
  }
  if (done) return <p className="text-sm text-hoja">Reseña enviada ✓</p>
  return (
    <div className="mt-2 space-y-2">
      <RatingStars value={rating} onChange={setRating} />
      <Textarea placeholder="¿Cómo estuvo tu caja?" value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button onClick={submit} className="bg-hoja">Enviar reseña</Button>
    </div>
  )
}
```

- [ ] **Step 3: Write `app/reservations/page.tsx`**

```tsx
import { createServerClient } from "@/lib/supabase/server"
import { ReviewForm } from "@/components/reviewForm"

export default async function MyReservations({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rows } = await supabase
    .from("reservation")
    .select("id,code,status,amount,box(title,storeId),review(id)")
    .eq("customerId", user!.id)
    .order("reservedAt", { ascending: false })

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="font-display text-2xl text-pino">Mis reservas</h1>
      {code && <p className="mt-2 rounded-lg bg-hoja/10 p-3 text-pino">Reserva confirmada. Muestra el código <b className="font-mono">{code}</b> en la tienda.</p>}
      <div className="mt-6 space-y-3">
        {rows?.map((r) => {
          const box = r.box as { title: string; storeId: string }
          const hasReview = Array.isArray(r.review) ? r.review.length > 0 : !!r.review
          return (
            <div key={r.id} className="rounded-xl border border-pino/10 bg-white p-4">
              <div className="flex justify-between">
                <span className="font-medium">{box.title}</span>
                <span className="font-mono text-sm">{r.code}</span>
              </div>
              <p className="text-sm text-hoja">${r.amount} · {r.status}</p>
              {r.status === "pickedUp" && !hasReview && <ReviewForm reservationId={r.id} storeId={box.storeId} />}
            </div>
          )
        })}
        {!rows?.length && <p className="text-hoja">Aún no tienes reservas.</p>}
      </div>
    </main>
  )
}
```

- [ ] **Step 4: Verify**

Run: reserve as customer → confirm pickup as merchant → back to `/reservations` → submit a review → it appears on the box's detail page.
Expected: the review form only shows for `pickedUp` reservations without an existing review; RLS rejects reviews for non-pickedUp reservations.

- [ ] **Step 5: Commit**

```bash
git add actions/reviews.ts components/reviewForm.tsx app/reservations/page.tsx
git commit -m "feat: add my reservations and verified review submission"
```

---

## Task 15: Daily cron (expire + keep-alive) + error/not-found boundaries

**Files:**
- Create: `.github/workflows/cron.yml`, `app/error.tsx`, `app/not-found.tsx`
- Test: manual (`workflow_dispatch` run returns 200; error page renders)

**Interfaces:**
- Consumes: RPC `expire_reservations` (called with service key).

- [ ] **Step 1: Write `app/error.tsx`**

```tsx
"use client"
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-display text-2xl text-pino">Algo salió mal</h1>
      <p className="mt-2 text-hoja">Intenta de nuevo.</p>
      <button onClick={reset} className="mt-4 rounded-lg bg-pino px-4 py-2 text-white">Reintentar</button>
    </main>
  )
}
```

- [ ] **Step 2: Write `app/not-found.tsx`**

```tsx
import Link from "next/link"
export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-display text-2xl text-pino">No encontrado</h1>
      <Link href="/" className="mt-4 inline-block text-hoja underline">Volver al inicio</Link>
    </main>
  )
}
```

- [ ] **Step 3: Write `.github/workflows/cron.yml`**

```yaml
name: daily-maintenance
on:
  schedule:
    - cron: "0 8 * * *"
  workflow_dispatch:
jobs:
  maintain:
    runs-on: ubuntu-latest
    steps:
      - name: Expire reservations and keep Supabase awake
        run: |
          curl -sf -X POST "$SUPABASE_URL/rest/v1/rpc/expire_reservations" \
            -H "apikey: $SERVICE_KEY" -H "Authorization: Bearer $SERVICE_KEY" \
            -H "Content-Type: application/json" -d '{}'
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

- [ ] **Step 4: Add GitHub secrets (manual)**

In the repo Settings → Secrets → Actions: add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

- [ ] **Step 5: Verify**

Trigger the workflow manually (Actions → daily-maintenance → Run workflow).
Expected: green run; the curl returns the number of expired reservations. Manually set a reservation `expiresAt` in the past and confirm the run flips it to `expired` and restocks its box.

- [ ] **Step 6: Commit**

```bash
git add app/error.tsx app/not-found.tsx .github/workflows/cron.yml
git commit -m "feat: add daily expire/keep-alive cron and error boundaries"
```

---

## Task 16: E2E happy path + RLS integration test

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/customerReserve.spec.ts`, `tests/unit/rls.test.ts`
- Test: the two files themselves

**Interfaces:**
- Consumes: seeded demo accounts and boxes (Task 5); running dev server.

- [ ] **Step 1: Write `tests/unit/rls.test.ts`**

```ts
import { describe, it, expect, beforeAll } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function signedIn(email: string, password: string) {
  const c = createClient(url, anon)
  await c.auth.signInWithPassword({ email, password })
  return c
}

describe("RLS", () => {
  let victimBoxId: string
  const pw = "rls12345"
  const intruderEmail = `intruder${Date.now()}@t.co`

  beforeAll(async () => {
    const victim = await admin.auth.admin.createUser({ email: `victim${Date.now()}@t.co`, password: pw, email_confirm: true })
    await admin.from("profile").update({ role: "merchant" }).eq("id", victim.data.user!.id)
    const { data: store } = await admin.from("store").insert({ ownerId: victim.data.user!.id, name: "V", address: "x", lat: -2.1, lng: -79.9 }).select().single()
    const { data: box } = await admin.from("box").insert({ storeId: store!.id, title: "V", originalPrice: 2, price: 1, stockQty: 5, pickupStart: new Date().toISOString(), pickupEnd: new Date(Date.now() + 3600e3).toISOString() }).select().single()
    victimBoxId = box!.id
    const intruder = await admin.auth.admin.createUser({ email: intruderEmail, password: pw, email_confirm: true })
    await admin.from("profile").update({ role: "merchant" }).eq("id", intruder.data.user!.id)
  })

  it("a merchant cannot update another store's box", async () => {
    const c = await signedIn(intruderEmail, pw)
    const { data } = await c.from("box").update({ price: 0 }).eq("id", victimBoxId).select()
    expect(data?.length ?? 0).toBe(0)
    const { data: check } = await admin.from("box").select("price").eq("id", victimBoxId).single()
    expect(Number(check!.price)).toBe(1)
  })

  it("a customer cannot insert a review without a pickedUp reservation", async () => {
    const c = await signedIn("cliente@rescat.ec", "rescat123")
    const uid = (await c.auth.getUser()).data.user!.id
    const { error } = await c.from("review").insert({ reservationId: victimBoxId, storeId: victimBoxId, customerId: uid, rating: 5, comment: "x" })
    expect(error).not.toBeNull()
  })
})
```

- [ ] **Step 2: Run the RLS test**

Run: `npx vitest run tests/unit/rls.test.ts`
Expected: PASS — intruder update affects 0 rows and leaves price unchanged; unverified review insert errors.

- [ ] **Step 3: Install Playwright**

```bash
npm i -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 4: Write `playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "tests/e2e",
  use: {
    baseURL: "http://localhost:3000",
    geolocation: { latitude: -2.171, longitude: -79.902 },
    permissions: ["geolocation"],
  },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: true },
})
```

- [ ] **Step 5: Write `tests/e2e/customerReserve.spec.ts`**

```ts
import { test, expect } from "@playwright/test"

test("customer logs in, reserves a box, and gets a code", async ({ page }) => {
  await page.goto("/login")
  await page.locator('input[type="email"]').fill("cliente@rescat.ec")
  await page.locator('input[type="password"]').fill("rescat123")
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.waitForURL("/")
  await expect(page.getByRole("heading", { name: /Rescata comida/ })).toBeVisible()
  await page.locator("a[href^='/box/']").first().click()
  await page.getByRole("button", { name: "Reservar" }).click()
  await page.waitForURL(/\/reserve\//)
  await page.getByRole("button", { name: "Confirmar reserva" }).click()
  await expect(page.getByText(/RC-/)).toBeVisible()
})
```

- [ ] **Step 6: Run the E2E test**

Ensure seed has stock (re-run `npx tsx supabase/seed.ts` if needed).
Run: `npx playwright test`
Expected: PASS — the reservation confirmation shows an `RC-` code.

- [ ] **Step 7: Add scripts and commit**

Add to `package.json` scripts: `"test:e2e": "playwright test"`.
```bash
git add playwright.config.ts tests/e2e/customerReserve.spec.ts tests/unit/rls.test.ts package.json
git commit -m "test: add E2E reserve happy path and RLS integration tests"
```

---

## Appendix: Spec coverage map

| Spec requirement (§) | Task(s) |
|---|---|
| Auth + roles, Google + email/password (§3, §7) | 6 |
| Merchant publish/configure boxes + image (§2, §5.2) | 8 |
| Discovery by proximity — list (§2, §5.1) | 10 |
| Discovery — map (§2, §8) | 11 |
| Box detail + items + reviews display (§4, §5) | 12 |
| Reserve atomic + mock payment + code (§4, §5.1, §8) | 4, 13 |
| Merchant confirm pickup (§5.3) | 9 |
| Reviews: verified submit + avg per store + seeded (§4, §5.5, §11) | 4, 12, 14, 5 |
| Expiration TTL + restock (§5.4) | 4, 15 |
| Credible Guayaquil seed (§11) | 5 |
| Error handling / states (§9) | 15 + inline toasts in 8/9/13/14 |
| Testing: overselling, RLS, E2E (§10) | 4, 16 |
| Deploy $0 (§1, §8, §13) | 1, 2, 15 |
| Cosecha theme + copy kit (§8) | 1 |
| Conventions: EN code/no comments/camelCase/Spanish UI (Global) | all |

**Known framework gotchas to expect during execution:** `useSearchParams()` in `app/login/page.tsx` may require a `<Suspense>` wrapper on `next build` (Next 15) — wrap the form in one if the build complains. Leaflet must never be imported in a Server Component (only via the `ssr:false` dynamic import in Task 11).
