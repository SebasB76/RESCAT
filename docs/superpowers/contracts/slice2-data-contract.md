# RESCAT Rebanada 2 — Contrato de datos (para workstreams)

La Fundación ya está migrada y sembrada. Los workstreams **solo leen** este schema y **crean archivos nuevos**. No corren migraciones ni tocan `lib/database.types.ts`, `supabase/*`, ni `app/merchant/layout.tsx`.

Cliente Supabase server: `import { createServerClient } from "@/lib/supabase/server"` (Server Components / Server Actions). Nunca service_role.

## Store scope (switcher "Ambas | tienda")
- Estado vive en el query param `?store=<storeId|todas>`. Los layouts NO reciben `searchParams`; las **pages** sí.
- Helper: `import { resolveStoreScope } from "@/lib/storeScope"` → `resolveStoreScope(searchParams.store)` devuelve `{ scope, storeId }` donde `storeId` es `string | null` (`null` = ambas).
- El `<StoreSwitcher>` ya está en el header del panel; no lo re-agregues.

## Tablas nuevas (columnas camelCase citadas)
- **product**: `id, storeId, name, brand, category, subcategory, cost, price, photoUrl, createdAt`. Lectura pública. Escritura solo dueño.
- **lot**: `id, productId, storeId, qty, unitCost, price, expiryDate, receivedAt, createdAt`. Lectura/escritura solo dueño (RLS). No lo consultes crudo para UI de niveles → usa `lots_with_level`.
- **purchase**: `id, customerId, storeId, status('pending'|'paid'|'pickedUp'|'cancelled'), paymentMethod('cashOnPickup'|'cardMock'), code, total, createdAt`. Cliente inserta/lee lo suyo.
- **purchase_item**: `id, purchaseId, productId, qty, price`.
- Analítica **pre-sembrada** (léelas directo, filtrando por scope): **sales_kpi** `(storeId, ventasTotal, gananciaTotal, nPedidos, nClientes)`, **category_sales** `(storeId, category, sales, profit, qty)`, **monthly_sales** `(storeId, month, sales, profit)`, **top_product** `(storeId, rank, name, brand, sales, profit, qty)`, **basket_rule** `(storeId, a, b, catA, catB, freq, confAB, confBA, lift)`. En todas, `storeId = null` es la fila "ambas/todas".
- **box.tipo**: enum `box_tipo` = `'solo' | 'duo' | 'familia'`.

### Filtrar analítica por scope
```ts
const q = supabase.from("category_sales").select("*")
const { data } = storeId ? await q.eq("storeId", storeId) : await q.is("storeId", null)
```

## Funciones RPC (analítica de inventario, calculada en vivo)
- `supabase.rpc("lots_with_level", { p_store })` → filas por lote: `id, storeId, productId, productName, brand, category, subcategory, receivedAt, expiryDate, daysToExpiry, qty, unitCost, price, totalValue, level('VENCIDO'|'CRITICO'|'ALERTA'|'ADVERTENCIA'|'OK'), autoDiscountPct, rescatPrice`. `p_store` = storeId o `null` (ambas).
- `supabase.rpc("inventory_kpis", { p_store })` → array de 1 fila: `valorTotal, nLotes, criticos, enAlerta, advertencia, ok, valorRiesgo7d, valorRiesgo30d, qtyRiesgo30d`.
- `supabase.rpc("list_boxes_near", { p_lat, p_lng })` → ahora incluye `tipo` (para filtro de cajas en cliente).

Umbrales (ya aplicados en `lots_with_level`): ≤0 VENCIDO(0%), ≤7 CRITICO(55%), ≤14 ALERTA(40%), ≤30 ADVERTENCIA(25%), resto OK(0%).

## Rutas por workstream (crea SOLO lo tuyo)
- WS-A: `app/merchant/page.tsx` (reemplaza el stub de dashboard actual).
- WS-B: `app/merchant/trazabilidad/page.tsx` (+ componentes propios).
- WS-C: `app/merchant/ofertas/page.tsx`.
- WS-D: `app/merchant/cesta/page.tsx`.
- WS-E: `app/merchant/ventas/page.tsx`, `app/merchant/ranking/page.tsx`.
- WS-F: `app/catalogo/**`, `components/cart*`, `actions/orders.ts` (inserta purchase + purchase_item, respeta RLS: customerId = auth.uid()).
- WS-G: header/hero/filtros del cliente en `app/page.tsx` (dueño único de ese archivo; WS-F NO lo toca).

Nav del panel ya enlaza todas las rutas de Análisis (dan 404 hasta que las crees).

## Fuente de datos legacy (referencia UI)
`legacy/index.html` (panel), `legacy/cliente.html` (tienda). Replicar funcionalidad, no el markup.
