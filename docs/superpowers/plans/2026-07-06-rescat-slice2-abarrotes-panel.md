# RESCAT Rebanada 2 — Abarrotes + Panel PYME (Plan)

**Fecha:** 2026-07-06
**Goal:** Expandir RESCAT de "solo cajas sorpresa" a **tienda completa** (cajas + catálogo de abarrotes) con un **panel merchant rico** (trazabilidad de inventario + analítica), adaptando los dos prototipos al stack real.
**Referencia (spec funcional/visual):** `legacy/index.html` (panel merchant) y `legacy/cliente.html` (tienda cliente). Se replica su FUNCIONALIDAD en Next+Supabase; el pulido de diseño es posterior.
**Stage:** MVP funcional; front polish después.

---

## 0. Modelo de paralelización (LEER PRIMERO)

- **Hay UNA sola BD Supabase.** Por eso **el schema, las migraciones y el seed van SERIALIZADOS en la Fundación**. Los agentes en paralelo **NO corren migraciones**.
- La **Fundación se mergea a `master` primero**. Recién ahí arrancan los **workstreams en paralelo**, cada uno en su **git worktree + branch**, leyendo el schema ya migrado y **creando archivos NUEVOS** (rutas/componentes) para no chocar.
- **Regla anti-conflicto:** cada workstream crea sus propias rutas + componentes; **no edita archivos de otro workstream**. Los puntos compartidos (nav del panel, `lib/database.types.ts`, contexto de tienda) se dejan listos en la Fundación.
- **Orden de merge:** Fundación → luego A–G en paralelo → mergeo cada uno tras review.

---

## 1. Cimientos de datos (nuevos)

Columnas camelCase citadas en SQL; tipos hand-authored (sin Docker para `gen types`). Migraciones append-only desde `0007`.

- **product** — catálogo por tienda. `id`, `storeId→store`, `name`, `brand`, `category`, `subcategory`, `price`, `photoUrl`, `createdAt`.
- **lot** — lote de inventario (trazabilidad). `id`, `productId→product`, `storeId→store`, `qty`, `unitCost`, `expiryDate`, `receivedAt`, `createdAt`. Derivados en vista: `daysToExpiry`, `level` (VENCIDO/CRITICO/ALERTA/ADVERTENCIA/OK), `autoDiscountPct`, `rescatPrice`, `totalValue`.
- **saleLine** — historial de ventas (sembrado del Excel, para MBA/ventas/top). `id`, `storeId`, `saleDate`, `customerName`, `productName`, `brand`, `category`, `qty`, `netSales`, `profit`.
- **order** + **orderItem** — checkout del carrito de abarrotes. `order`: `id`, `customerId→profile`, `storeId`, `status` (`pending`|`paid`|`pickedUp`|`cancelled`), `paymentMethod` (`cashOnPickup`|`cardMock`), `code`, `total`, `createdAt`. `orderItem`: `id`, `orderId→order`, `productId→product`, `qty`, `price`.
- **box.tipo** — enum `box_tipo` (`solo`|`duo`|`familia`) agregado a `box`.

**SQL de analítica (la Fundación las crea; los workstreams solo las llaman):**
- `lots_with_level(p_store)` — vista/función: lotes + nivel + auto-descuento + valor (para trazabilidad, ofertas, dashboard).
- `inventory_kpis(p_store)` — valor total, #críticos, #alerta, riesgo 7d/30d, etc.
- `sales_by_category(p_store)`, `sales_monthly_trend(p_store)`, `top_products(p_store)` — para Ventas/Ranking.
- `mba_rules(p_store)` — reglas de asociación (co-ocurrencia por cesta cliente+mes, con freq/confianza/lift) desde `saleLine`.
- Todas aceptan filtro por tienda (o "ambas") para el store switcher.

**Seed (`supabase/seed.ts` extendido):** importar `legacy/SampleSuperstore.xlsx` (hoja stock → products + lots con caducidades realistas; hoja ventas → saleLine) usando un parser xlsx en Node. Genera catálogo, inventario y ~historial de ventas creíble para ambas tiendas. Reutiliza la lógica del viejo `legacy/actualizar_rescat.py` como referencia.

---

## 2. Fase Fundación (SERIAL — branch `feat/slice2-foundation`, se mergea primero)

1. **Migraciones** `0007_catalog_inventory.sql` (product, lot), `0008_sales.sql` (saleLine), `0009_orders.sql` (order, orderItem), `0010_box_tipo.sql`, `0011_analytics.sql` (vistas/funciones), con RLS: lectura pública de product/lot; escritura solo owner+merchant; order/orderItem del propio cliente; saleLine lectura solo merchant dueño.
2. **Aplicar** por psql (`$SUPABASE_DB_URL`). **Hand-author** `lib/database.types.ts` (tablas + enums + Functions de las nuevas RPC).
3. **Seed** desde el Excel (products, lots, saleLine) + `tipo` en las cajas sembradas.
4. **Nav/estructura compartida:** reestructurar `app/merchant/layout.tsx` con secciones (Operación / Análisis) y **todos los links** ya apuntando a las rutas que los workstreams llenarán (aunque aún no existan). Crear un **StoreSwitcher** (context/estado "ambas | juanita | maría") reutilizable por cliente y merchant.
5. **Contrato de datos** documentado (nombres exactos de funciones/columnas) para que cada workstream lea sin adivinar.
6. Verificar `tsc`/`build`. Merge a `master`.

---

## 3. Workstreams en paralelo (cada uno = su worktree + branch, solo lectura de schema)

Cada agente recibe: su alcance + la **sección relevante del prototipo** (index.html / cliente.html) como spec de UI + el contrato de datos. Crea rutas/componentes NUEVOS.

### WS-A · Merchant Dashboard — `feat/s2-dashboard`
KPIs (valor inventario, críticos ≤7d, alerta 8–14d, ventas, riesgo 30d) + gráfico stock por categoría + tabla alertas urgentes + top combos preview. Rutas: `app/merchant/page.tsx` (reemplaza el listado básico). Lee: `inventory_kpis`, `lots_with_level`, `mba_rules`. Ref: index.html `#page-dashboard`.

### WS-B · Trazabilidad — `feat/s2-trazabilidad`
Tabla de lotes (producto, marca, categoría, tienda, ingreso, caducidad, días, urgencia, qty, costo, valor, desc%, precio RESCAT, nivel) + filtros (nivel/tienda/categoría/búsqueda) + **export CSV**. Ruta: `app/merchant/trazabilidad/page.tsx`. Lee: `lots_with_level`. Ref: `#page-trazabilidad`.

### WS-C · Ofertas Especiales — `feat/s2-ofertas`
Grid de productos por vencer (no en caja) con rebaja: stock, valor en riesgo, precio actual vs oferta. Ruta: `app/merchant/ofertas/page.tsx`. Lee: `lots_with_level` (filtrado). Ref: `#page-ofertas`.

### WS-D · Cesta de Compra (MBA) — `feat/s2-mba`
Cross-selling por producto + tabla de reglas (freq, conf A→B, conf B→A, lift). Ruta: `app/merchant/cesta/page.tsx`. Lee: `mba_rules`. Ref: `#page-basket`.

### WS-E · Ventas & Margen + Top Productos — `feat/s2-ventas`
Ventas/margen por categoría + tendencia mensual + Top 20 por ganancia. Rutas: `app/merchant/ventas/page.tsx`, `app/merchant/ranking/page.tsx`. Lee: `sales_by_category`, `sales_monthly_trend`, `top_products`. Ref: `#page-ventas`, `#page-ranking`.

### WS-F · Cliente: catálogo de abarrotes + carrito — `feat/s2-catalogo`
Catálogo de productos individuales (grid + filtro por categoría), detalle de producto, **carrito** (panel lateral) y **checkout real** (crea `order` + `orderItem`, pago cash/cardMock, código). Rutas: `app/catalogo/page.tsx` (o sección en `/`), `components/cart*`, `actions/orders.ts`. Lee: `product`; escribe: `order`. Ref: cliente.html catálogo + carrito.

### WS-G · Cliente: selector de tienda + filtros + hero — `feat/s2-cliente-nav`
StoreSwitcher en el cliente (ver por tienda), filtro de cajas por `tipo`, hero con stats (cajas/productos/ahorro), ordenar por rating. Toca: header del cliente + la lista de descubrimiento (coordinar con WS-F sobre `app/page.tsx` — WS-G dueño del header/filtros, WS-F dueño del catálogo). Ref: cliente.html hero + pills + selector.

---

## 4. Integración y merge

- Merge **Fundación primero**. Luego A–G; reviso y mergeo cada branch a `master` conforme pasan.
- **Conflictos esperados mínimos** (archivos disjuntos). Punto de coordinación: `app/page.tsx` (WS-F y WS-G) y `app/merchant/layout.tsx` (ya fijado en Fundación) → asignar dueño único por archivo.
- **Review por workstream** (correctitud + que no rompa build/tsc) + una **revisión final** de toda la rama integrada, con foco en RLS de las nuevas tablas (order/product/lot/saleLine) y en que las queries de analítica no filtren datos entre tiendas.
- Seed deja data creíble; los tests (vitest/playwright) se extienden por workstream donde aplique.

## 5. Branching
`master` → `feat/slice2-foundation` (merge) → worktrees `feat/s2-*` (paralelo) → merge a `master`.
