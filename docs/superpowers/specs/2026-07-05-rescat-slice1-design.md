# RESCAT — Diseño de la Rebanada 1

**Fecha:** 2026-07-05
**Estado:** Aprobado — listo para plan de implementación
**Rev:** 2 (mapa + reseñas incluidos)
**Alcance:** MVP marketplace, loop reserva → retiro

---

## 1. Contexto y objetivo

RESCAT es un marketplace de dos lados estilo *Too Good To Go* para **Ecuador (Guayaquil)**: tiendas de barrio publican **cajas sorpresa** de productos próximos a caducar a precio rebajado; los clientes ("Rescatistas") las descubren por cercanía, reservan en la app y **pagan en efectivo al retirar** (pickup).

**Naturaleza:** MVP para validar demanda. YAGNI, todo en tiers gratuitos, iterar con usuarios reales. Es un demo funcional real y debe verse serio/completo.

**Diferenciador (wedge):** reserva-en-app + **cash-on-pickup** (vs Fresh Finds, solo pago digital) + enfoque hiperlocal Guayaquil. Aprendizaje de Cirkula: mostrar ítems + "consumir antes de" (híbrido), no caja 100% misterio.

**Restricción dura:** costo **$0** (tiers gratuitos). Capacidad limitada es aceptable.

## 2. Alcance de la Rebanada 1

**Dentro:**
- Auth + roles (cliente / merchant): **Google** para cliente + email/contraseña para merchant.
- Merchant: publica y configura cajas (título, ítems, precio, stock, ventana de pickup, `bestBefore`, foto).
- Cliente: descubre cajas por **cercanía** (vista **lista + mapa** simple), ve detalle, **reserva** (stock atómico), elige **efectivo al retirar** (default) o **tarjeta mockeada**, recibe **código** de retiro.
- Merchant: ve reservas y **confirma retiro**.
- **Reseñas** ⭐: el cliente califica tras el retiro (verified purchase); promedio por tienda visible en cards y detalle. Con reseñas demo sembradas.
- Desplegado, con datos reales y **datos demo creíbles**.

**Fuera (rebanadas posteriores):**
- Notificaciones WhatsApp.
- **Gateway de pago real** (EC: PayPhone/Kushki/…) — el mock ya cubre el demo.
- Onboarding self-serve de tiendas (MVP: alta manual / concierge).
- Ítems estructurados con cantidades (MVP: lista de texto).
- **Mapa rico** (clustering, rutas, tracking en vivo) — el mapa simple sí entra.
- UI dedicada de admin (se opera vía dashboard de Supabase).

## 3. Usuarios y roles

- **Cliente ("Rescatista"):** navega sin registro; login **Google** (email/clave de respaldo) **solo al reservar**.
- **Merchant (tienda):** entra por `/merchant` con **email + contraseña** (cuentas creadas a mano). Ve solo su tienda.
- **Admin (operador de plataforma):** sin UI propia en la Rebanada 1 — se opera desde el **dashboard de Supabase** (editar tablas, dar de alta tiendas, moderar reseñas). UI dedicada = rebanada futura.

## 4. Modelo de datos

Columnas conceptuales; casing físico `snake_case` en Postgres ↔ `camelCase` en TS vía tipos generados.

- **profile** — extiende `auth.users`. `id`, `role` (`customer`|`merchant`), `fullName`, `phone`.
- **store** — `id`, `ownerId→profile`, `name`, `address`, `neighborhood`, `lat`, `lng`, `photoUrl`, `pickupInfo`, `createdAt`.
- **box** — `id`, `storeId→store`, `title`, `description`, `items` (lista de texto), `category`, `originalPrice`, `price`, `stockQty`, `bestBefore` (fecha), `pickupStart`, `pickupEnd`, `photoUrl`, `status` (`active`|`soldOut`|`expired`), `createdAt`.
- **reservation** — `id`, `boxId→box`, `customerId→profile`, `code`, `paymentMethod` (`cashOnPickup`|`cardMock`), `status` (`reserved`|`paid`|`pickedUp`|`expired`|`cancelled`), `amount`, `reservedAt`, `expiresAt`, `pickedUpAt`.
- **review** — `id`, `reservationId→reservation` (único, verified purchase), `storeId→store` (para promedio/display), `customerId→profile`, `rating` (1–5), `comment`, `createdAt`.

**Relaciones:** merchant 1—* store · store 1—* box · box 1—* reservation · customer 1—* reservation · reservation 1—1 review.

**Agregado:** promedio de `rating` por tienda (query/vista), mostrado en cards y detalle.

**Invariante crítico:** `reserveBox(boxId, customerId, paymentMethod)` = función Postgres transaccional. Valida `stockQty > 0`, descuenta stock, crea la reserva con `code` único y la retorna. **Único camino** para reservar → imposible sobre-vender.

**RLS:** cliente lee cajas `active` y solo sus reservas; puede insertar `review` solo sobre una reserva propia en estado `pickedUp` (lectura de reseñas pública). Merchant lee/edita solo su store, sus boxes y las reservas de sus boxes.

## 5. Flujos

1. **Cliente compra:** `/` → pide ubicación (si niega → todas/recientes) → explora en **lista o mapa** → abre caja → *Reservar* → login si hace falta → resumen → elige **efectivo al retirar** o **tarjeta (mock)** → `reserveBox()` descuenta y emite `code` → confirmación (código, tienda, dirección, ventana) → aparece en *Mis reservas*.
2. **Tienda publica:** login `/merchant` → *Nueva caja* → datos + foto → guardar → queda `active`, visible en descubrimiento.
3. **Tienda confirma retiro:** *Reservas* → busca `code` → *Marcar retirado* → `pickedUp` (cobra efectivo si aplica).
4. **Expiración (sistema):** la reserva nace con `expiresAt` (= fin de ventana). Cron diario expira las vencidas y **devuelve stock**. Fallback: expiración perezosa al leer.
5. **Cliente reseña:** tras `pickedUp`, desde *Mis reservas* → *Calificar* (estrellas + comentario) → suma al promedio de la tienda.

## 6. Pantallas / rutas

- **Cliente:** `/` descubrimiento (**lista + mapa**, público) · `/box/[id]` detalle (público, muestra rating + reseñas) · `/reserve/[boxId]` reserva + pago (auth) · confirmación · `/reservations` mis reservas (auth, con *Calificar* tras retiro).
- **Merchant:** `/merchant` dashboard · `/merchant/boxes/new` · `/merchant/boxes/[id]` editar · `/merchant/reservations`.
- **Compartidas:** `/login`, `/signup`.

**Estados por pantalla:** vacío (sin cajas cerca → muestra todas) · geo denegada (→ recientes) · agotado (carrera → "se agotó") · carga · error (boundary + toast, sin stack trace).

## 7. Autenticación y accesos

- Un solo app Next; **misma auth Supabase** para ambos roles.
- Cliente: **OAuth Google desde el inicio** + email/clave de respaldo. Merchant: email/clave.
- **Guard** en middleware: público `/` y `/box/[id]`; reservar exige sesión de cliente; `/merchant/*` exige `role=merchant`.
- Patrón "una empresa, dos puertas" (como TGTG for Business, Uber/Uber Driver, Shopify admin).

## 8. Arquitectura técnica

**Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui → Vercel (free). Backend: Supabase (Postgres + Auth + Storage + RLS, free).

- **Next:** Server Components para lectura; Server Actions para mutación (`createBox`, `reserveBox`, `confirmPickup`, `updateBox`, `submitReview`); middleware para el guard.
- **Front / tema "Cosecha":** tokens Tailwind — cream `#F6EFDD`, pino `#123B29`, hoja `#5E8A31`, dorado `#E5A11C`, terracota `#CE5228` (terracota/rojo solo urgencia). Tipos **Fraunces** (display) + **Hanken Grotesk** (texto). Copy kit: "Rescata comida. Ahorra. Cuida el planeta.", comprador = "Rescatista", ancla de misión "1 de cada 3 alimentos termina en la basura". Chips de urgencia y contador de impacto = capa de contenido.
- **Mapa:** Leaflet + react-leaflet + tiles **OpenStreetMap** (gratis, sin API key). Componente **client-only** (dynamic import por el SSR de Next); pines de tiendas + marcador de ubicación del cliente; toggle lista/mapa en descubrimiento.
- **reserveBox():** RPC transaccional (ver §4).
- **Reseñas:** tabla `review` (verified purchase vía `reservationId`) con RLS; promedio por tienda por query/vista.
- **Geo:** `lat`/`lng` en store; el descubrimiento ordena por distancia (haversine en SQL) desde la ubicación del navegador (Geolocation API).
- **Storage:** bucket público para fotos de cajas.
- **Pago:** módulo `payment` con modos `cashOnPickup` (real, default) y `cardMock` (simula aprobación ~1s). Migrar a gateway real = swap del módulo.
- **Seed:** script TS de una vez (ver §11).
- **Deploy:** Vercel + Supabase; env vars; **cron diario gratis** (GitHub Action) = expira reservas vencidas (devuelve stock) + ping anti-pausa a Supabase.
- **Convenciones:** `snake_case` en DB ↔ `camelCase` en TS (tipos generados); archivos de código en camelCase (rutas Next en minúscula, obligado por framework). Código en **inglés, sin comentarios**; copy de UI y datos de dominio en **español**.

## 9. Manejo de errores

Carrera de stock → error "se agotó" + refresh · geo denegada → fallback recientes · login falla → mensaje claro · falla subida de imagen → guarda con placeholder, reintentar · reserva vencida → `expired`, stock devuelto · error inesperado → error boundary + toast (sin stack trace / info leak).

## 10. Testing (ligero)

- **Crítico:** `reserveBox()` no sobre-vende bajo concurrencia.
- **RLS:** aislamiento entre tiendas; un cliente no entra a `/merchant`; solo se puede reseñar una reserva propia `pickedUp`.
- **E2E (1–2, Playwright):** cliente reserva; tienda confirma retiro.
- Resto: manual durante el piloto. Sin cobertura exhaustiva (es un MVP).

## 11. Datos demo creíbles

Requisito: se ve como un negocio real de Guayaquil — nada de "Producto 1" ni Lorem ipsum.

- **2 tiendas piloto:** nombres de tienda de barrio (p. ej. *Mini Market Juanita*, *Despensa Doña María*), direcciones + coordenadas plausibles en sectores reales (Urdesa, Alborada, Sauces, Los Ceibos…), horario y ventana de pickup realistas.
- **Catálogo curado:** marcas reales de EC (Toni, Supan, Güitig, Nestlé, La Favorita…), precios en USD coherentes, categorías reales.
- **Cajas creíbles:** composición lógica (Caja Desayuno, Panadería del día, Frutas & Verduras, Lácteos por vencer…), `bestBefore` a pocos días, precio original vs rebajado realista (30–60% off), stock chico (3–8), ítems listados.
- **Reseñas sembradas:** variadas y creíbles (3.5–5 ⭐), comentarios realistas en español.
- **Cuentas demo:** 1 tienda + 1 cliente, listas para demostrar el flujo completo.

## 12. Criterios de éxito

- El flujo completo corre end-to-end desplegado: cliente descubre → reserva → retiro → reseña; tienda publica → confirma.
- Se puede mostrar a las 2 tiendas y recoger feedback cualitativo.
- $0 de costo de infraestructura.

## 13. Riesgos y consideraciones

- **Overselling:** mitigado por `reserveBox()` atómico (con test).
- **Supabase free se pausa** tras ~1 semana inactivo → ping diario del cron.
- **Vercel Hobby = no comercial:** OK para un demo sin cobros reales; revisar al integrar pagos reales.
- **Pagos EC:** no hay Stripe → gateway local en rebanada futura.
- **Geo/mapa sin costo:** Geolocation API + Leaflet/OSM + haversine; sin Google Maps de pago. Mapa es **client-only** (dynamic import).
- **Confianza:** reseñas (sembradas al inicio) + transparencia (ítems + `bestBefore`) + señales de confianza en la UI.

## 14. Decisiones (resueltas)

- Login **Google desde el inicio** (con email/clave de respaldo).
- **Mapa simple** y **reseñas**: incluidos en la Rebanada 1.
- **Gateway de pago real:** diferido (mock `cardMock` incluido).
- **Admin:** vía dashboard de Supabase; sin UI propia en esta rebanada.
- "Zona RESCAT" (estante físico de pickup): idea operativa, **fuera del software**.
