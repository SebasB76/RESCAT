# RESCAT — Diseño de la Rebanada 1

**Fecha:** 2026-07-05
**Estado:** Borrador para revisión
**Alcance:** MVP marketplace, loop reserva → retiro

---

## 1. Contexto y objetivo

RESCAT es un marketplace de dos lados estilo *Too Good To Go* para **Ecuador (Guayaquil)**: tiendas de barrio publican **cajas sorpresa** de productos próximos a caducar a precio rebajado; los clientes ("Rescatistas") las descubren por cercanía, reservan en la app y **pagan en efectivo al retirar** (pickup).

**Naturaleza:** MVP para validar demanda. YAGNI agresivo, todo en tiers gratuitos, iterar con usuarios reales. Es un demo funcional real.

**Diferenciador (wedge):** reserva-en-app + **cash-on-pickup** (vs Fresh Finds, que es solo pago digital) + enfoque hiperlocal Guayaquil. Aprendizaje de Cirkula: mostrar ítems + "consumir antes de" (híbrido), no caja 100% misterio.

**Restricción dura:** costo **$0** (tiers gratuitos). Capacidad limitada es aceptable.

## 2. Alcance de la Rebanada 1

**Dentro:**
- Auth + roles (cliente / merchant).
- Merchant: publica y configura cajas (título, ítems, precio, stock, ventana de pickup, `bestBefore`, foto).
- Cliente: descubre cajas ordenadas por **cercanía (simple)**, ve detalle, **reserva** (stock atómico), elige **efectivo al retirar** (default) o **tarjeta mockeada**, recibe **código** de retiro.
- Merchant: ve reservas y **confirma retiro**.
- Desplegado, con datos reales y **datos demo creíbles**.

**Fuera (rebanadas posteriores):**
- Reseñas ⭐ (necesitan retiros hechos).
- Notificaciones WhatsApp.
- Gateway de pago real (EC: PayPhone/Kushki/…).
- Onboarding self-serve de tiendas (en MVP: alta manual / concierge).
- Ítems estructurados con cantidades (en MVP: lista de texto).
- Mapa rico interactivo (en MVP: orden por distancia, sin mapa elaborado).

## 3. Usuarios y roles

- **Cliente ("Rescatista"):** navega sin registro; se loguea **solo al reservar**. Login: **Google** (con email+clave de respaldo).
- **Merchant (tienda):** entra por `/merchant` con **email + contraseña** (cuentas creadas a mano). Ve solo su tienda.
- **Admin:** fuera de la Rebanada 1.

## 4. Modelo de datos

Columnas conceptuales; casing físico `snake_case` en Postgres ↔ `camelCase` en TS vía tipos generados.

- **profile** — extiende `auth.users`. `id`, `role` (`customer`|`merchant`), `fullName`, `phone`.
- **store** — `id`, `ownerId→profile`, `name`, `address`, `neighborhood`, `lat`, `lng`, `photoUrl`, `pickupInfo`, `createdAt`.
- **box** — `id`, `storeId→store`, `title`, `description`, `items` (lista de texto), `category`, `originalPrice`, `price`, `stockQty`, `bestBefore` (fecha), `pickupStart`, `pickupEnd`, `photoUrl`, `status` (`active`|`soldOut`|`expired`), `createdAt`.
- **reservation** — `id`, `boxId→box`, `customerId→profile`, `code`, `paymentMethod` (`cashOnPickup`|`cardMock`), `status` (`reserved`|`paid`|`pickedUp`|`expired`|`cancelled`), `amount`, `reservedAt`, `expiresAt`, `pickedUpAt`.

**Relaciones:** merchant 1—* store · store 1—* box · box 1—* reservation · customer 1—* reservation.

**Invariante crítico:** `reserveBox(boxId, customerId, paymentMethod)` = función Postgres transaccional. Valida `stockQty > 0`, descuenta stock, crea la reserva con `code` único y la retorna. **Único camino** para reservar → imposible vender más que el stock.

**RLS:** el cliente lee cajas `active` y solo sus reservas; el merchant lee/edita solo su store, sus boxes y las reservas de sus boxes.

## 5. Flujos

1. **Cliente compra:** `/` → pide ubicación (si niega → todas/recientes) → abre caja → *Reservar* → login si hace falta → resumen → elige **efectivo al retirar** o **tarjeta (mock)** → `reserveBox()` descuenta y emite `code` → confirmación (código, tienda, dirección, ventana) → aparece en *Mis reservas*.
2. **Tienda publica:** login `/merchant` → *Nueva caja* → datos + foto → guardar → queda `active`, visible en descubrimiento.
3. **Tienda confirma retiro:** *Reservas* → busca `code` → *Marcar retirado* → `pickedUp` (cobra efectivo si aplica).
4. **Expiración (sistema):** la reserva nace con `expiresAt` (= fin de ventana). Un cron diario expira las vencidas y **devuelve stock**. Fallback: expiración perezosa al leer.

## 6. Pantallas / rutas

- **Cliente:** `/` descubrimiento (público) · `/box/[id]` detalle (público) · `/reserve/[boxId]` reserva + pago (auth) · confirmación · `/reservations` mis reservas (auth).
- **Merchant:** `/merchant` dashboard · `/merchant/boxes/new` · `/merchant/boxes/[id]` editar · `/merchant/reservations`.
- **Compartidas:** `/login`, `/signup`.

**Estados por pantalla:** vacío (sin cajas cerca → muestra todas) · geo denegada (→ recientes) · agotado (carrera → "se agotó") · carga · error (boundary + toast, sin stack trace).

## 7. Autenticación y accesos

- Un solo app Next; **misma auth Supabase** para ambos roles.
- Cliente: OAuth Google + email/clave de respaldo. Merchant: email/clave.
- **Guard** en middleware: público `/` y `/box/[id]`; reservar exige sesión de cliente; `/merchant/*` exige `role=merchant`.
- Patrón "una empresa, dos puertas" (como TGTG for Business, Uber/Uber Driver, Shopify admin).

## 8. Arquitectura técnica

**Stack:** Next.js (App Router) + TypeScript + Tailwind + shadcn/ui → Vercel (free). Backend: Supabase (Postgres + Auth + Storage + RLS, free).

- **Next:** Server Components para lectura; Server Actions para mutación (`createBox`, `reserveBox`, `confirmPickup`, `updateBox`); middleware para el guard.
- **Front / tema "Cosecha":** tokens Tailwind — cream `#F6EFDD`, pino `#123B29`, hoja `#5E8A31`, dorado `#E5A11C`, terracota `#CE5228` (terracota/rojo solo urgencia). Tipos **Fraunces** (display) + **Hanken Grotesk** (texto). Copy kit: "Rescata comida. Ahorra. Cuida el planeta.", comprador = "Rescatista", ancla de misión "1 de cada 3 alimentos termina en la basura". Chips de urgencia y contador de impacto = capa de contenido.
- **reserveBox():** RPC transaccional (ver §4).
- **Geo:** `lat`/`lng` en store; el descubrimiento ordena por distancia (haversine en SQL) desde la ubicación del navegador (Geolocation API).
- **Storage:** bucket público para fotos de cajas.
- **Pago:** módulo `payment` con modos `cashOnPickup` (real, default) y `cardMock` (simula aprobación ~1s). Migrar a gateway real = swap del módulo, sin tocar el resto.
- **Seed:** script TS de una vez (ver §11).
- **Deploy:** Vercel + Supabase; env vars para llaves; **cron diario gratis** (GitHub Action) = expira reservas vencidas (devuelve stock) + ping anti-pausa a Supabase.
- **Convenciones:** `snake_case` en DB ↔ `camelCase` en TS (tipos generados); archivos de código en camelCase (rutas Next en minúscula, obligado por framework). Código en **inglés, sin comentarios**; copy de UI y datos de dominio en **español**.

## 9. Manejo de errores

Carrera de stock → error "se agotó" + refresh · geo denegada → fallback recientes · login falla → mensaje claro · falla subida de imagen → guarda con placeholder, reintentar · reserva vencida → `expired`, stock devuelto · error inesperado → error boundary + toast (sin stack trace / info leak).

## 10. Testing (ligero)

- **Crítico:** `reserveBox()` no sobre-vende bajo concurrencia.
- **RLS:** aislamiento entre tiendas; un cliente no entra a `/merchant`.
- **E2E (1–2, Playwright):** cliente reserva; tienda confirma retiro.
- Resto: manual durante el piloto. Sin cobertura exhaustiva (es un MVP).

## 11. Datos demo creíbles

Requisito: se ve como un negocio real de Guayaquil — nada de "Producto 1" ni Lorem ipsum.

- **2 tiendas piloto:** nombres de tienda de barrio (p. ej. *Mini Market Juanita*, *Despensa Doña María*), direcciones + coordenadas plausibles en sectores reales (Urdesa, Alborada, Sauces, Los Ceibos…), horario y ventana de pickup realistas.
- **Catálogo curado:** marcas reales de EC (Toni, Supan, Güitig, Nestlé, La Favorita…), precios en USD coherentes, categorías reales.
- **Cajas creíbles:** composición lógica (Caja Desayuno, Panadería del día, Frutas & Verduras, Lácteos por vencer…), `bestBefore` a pocos días, precio original vs rebajado realista (30–60% off), stock chico (3–8), ítems listados.
- **Cuentas demo:** 1 tienda + 1 cliente, listas para demostrar el flujo completo.

## 12. Criterios de éxito (propuestos — a confirmar)

- El flujo completo corre end-to-end desplegado: cliente descubre → reserva → (retiro); tienda publica → confirma.
- Piloto real con las 2 tiendas durante ~2–4 semanas.
- Señal de validación: ≥ N reservas reales con retiro confirmado (fijar N con las tiendas) + feedback cualitativo de tiendas y clientes.
- $0 de costo de infraestructura durante el piloto.

## 13. Riesgos y consideraciones

- **Overselling:** mitigado por `reserveBox()` atómico (con test).
- **Supabase free se pausa** tras ~1 semana inactivo → ping diario del cron.
- **Vercel Hobby = no comercial:** OK para un demo sin cobros reales; revisar al integrar pagos reales.
- **Pagos EC:** no hay Stripe → gateway local en rebanada futura.
- **Geo sin costo:** Geolocation API + haversine; sin Google Maps de pago.
- **Confianza sin reseñas aún:** mitigar con transparencia (ítems + `bestBefore`) y señales de confianza en la UI.

## 14. Decisiones abiertas

- Confirmar N (umbral de reservas) y duración del piloto con las tiendas.
- ¿Login Google desde el inicio (requiere setup OAuth de Google, gratis) o arrancar solo email/clave y añadir Google luego? (Recomendado: Google desde el inicio, por fricción.)
- "Zona RESCAT" (estante físico de pickup en tienda): documentar como operación, fuera del software.
