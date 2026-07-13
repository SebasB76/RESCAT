import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { boxImagePath, imageSlugFor, photoUrlFor } from "./catalogImages"
config({ path: ".env.local" })

const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
const admin = createClient(base, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const ZERO = "00000000-0000-0000-0000-000000000000"
const round2 = (n: number) => Math.round(n * 100) / 100

type RealProduct = { name: string; brand: string | null; category: string; price: number; expiryDays: number; qty: number; promotion?: string }

const CATALOG: RealProduct[] = [
  { name: "Sal 2kg", brand: null, category: "Abarrotes", price: 0.80, expiryDays: 40, qty: 20 },
  { name: "Sal 1kg", brand: null, category: "Abarrotes", price: 0.50, expiryDays: 40, qty: 24 },
  { name: "Sal 1/2kg", brand: null, category: "Abarrotes", price: 0.35, expiryDays: 40, qty: 18 },
  { name: "Azúcar San Carlos 2kg", brand: "San Carlos", category: "Abarrotes", price: 1.70, expiryDays: 30, qty: 14 },
  { name: "Azúcar San Carlos 1kg", brand: "San Carlos", category: "Abarrotes", price: 0.90, expiryDays: 3, qty: 12 },
  { name: "Azúcar San Carlos 500g", brand: "San Carlos", category: "Abarrotes", price: 0.50, expiryDays: 30, qty: 16 },
  { name: "Azúcar San Carlos 250g", brand: "San Carlos", category: "Abarrotes", price: 0.25, expiryDays: 30, qty: 20 },
  { name: "Atún Real 160g", brand: "Real", category: "Enlatados", price: 1.25, expiryDays: 2, qty: 18 },
  { name: "Atún Isabel 160g", brand: "Isabel", category: "Enlatados", price: 1.25, expiryDays: 6, qty: 16 },
  { name: "Atún Va vamos 160g", brand: "Va vamos", category: "Enlatados", price: 1.35, expiryDays: 12, qty: 14 },
  { name: "Atún D'Gussto 140g", brand: "D'Gussto", category: "Enlatados", price: 1.00, expiryDays: 5, qty: 22, promotion: "Promo: 3 por $2.50" },
  { name: "Sardina Real 156g", brand: "Real", category: "Enlatados", price: 0.90, expiryDays: 15, qty: 18 },
  { name: "Sardina Real 425g", brand: "Real", category: "Enlatados", price: 1.75, expiryDays: 18, qty: 10 },
  { name: "Aceite Favorita 1lt", brand: "Favorita", category: "Aceites", price: 2.50, expiryDays: 3, qty: 12 },
  { name: "Aceite Criollo 1lt", brand: "Criollo", category: "Aceites", price: 2.35, expiryDays: 20, qty: 10 },
  { name: "Aceite Girasol 1lt", brand: "Girasol", category: "Aceites", price: 3.00, expiryDays: 25, qty: 8 },
  { name: "Aceite funda Rica Palma 950ml", brand: "Rica Palma", category: "Aceites", price: 1.60, expiryDays: 6, qty: 14 },
  { name: "Aceite funda Rica Palma 1lit", brand: "Rica Palma", category: "Aceites", price: 1.70, expiryDays: 22, qty: 12 },
  { name: "Aceite funda Palma de Oro", brand: "Palma de Oro", category: "Aceites", price: 1.70, expiryDays: 22, qty: 12 },
  { name: "Choclo dulce Facundo 140g", brand: "Facundo", category: "Enlatados", price: 1.00, expiryDays: 14, qty: 16 },
  { name: "Choclo dulce Facundo 425g", brand: "Facundo", category: "Enlatados", price: 1.60, expiryDays: 14, qty: 12 },
  { name: "Leche en funda Nutri 900ml", brand: "Nutri", category: "Lácteos", price: 1.00, expiryDays: 2, qty: 20 },
  { name: "Leche en funda Reyleche 900ml", brand: "Reyleche", category: "Lácteos", price: 1.00, expiryDays: 4, qty: 18 },
  { name: "Leche en Cartón Trú entera 1lt", brand: "Trú", category: "Lácteos", price: 1.00, expiryDays: 10, qty: 16 },
  { name: "Fideo Tallarín Doña Petrona 200g", brand: "Doña Petrona", category: "Pastas", price: 1.00, expiryDays: 25, qty: 20 },
  { name: "Fideo Tallarín Doña Petrona 400g", brand: "Doña Petrona", category: "Pastas", price: 1.50, expiryDays: 3, qty: 16 },
  { name: "Salsa de tomate Maggi 200g", brand: "Maggi", category: "Salsas y aderezos", price: 1.00, expiryDays: 3, qty: 18 },
  { name: "Mayonesa Maggi 200g", brand: "Maggi", category: "Salsas y aderezos", price: 1.40, expiryDays: 12, qty: 14 },
  { name: "Sazón Maggi 200g", brand: "Maggi", category: "Salsas y aderezos", price: 1.25, expiryDays: 30, qty: 16 },
  { name: "Sazón Maggi 150g", brand: "Maggi", category: "Salsas y aderezos", price: 1.00, expiryDays: 30, qty: 18 },
  { name: "Pan molde Blanco Supan 550g", brand: "Supan", category: "Panadería", price: 1.90, expiryDays: 2, qty: 12 },
  { name: "Pan Blanco sin corteza Supan 550g", brand: "Supan", category: "Panadería", price: 2.90, expiryDays: 5, qty: 8 },
  { name: "Rapiditas medianas 250g", brand: "Supan", category: "Panadería", price: 1.00, expiryDays: 7, qty: 14 },
  { name: "Chocolate Cocoa 160g", brand: null, category: "Snacks", price: 1.00, expiryDays: 3, qty: 16 },
  { name: "Café Don Café 40g", brand: "Don Café", category: "Café", price: 1.75, expiryDays: 3, qty: 12 },
  { name: "Café Don Café 10g", brand: "Don Café", category: "Café", price: 0.50, expiryDays: 20, qty: 24 },
  { name: "Café Oro 40g", brand: "Oro", category: "Café", price: 1.00, expiryDays: 20, qty: 18 },
  { name: "Café Nescafé tradicional 160g", brand: "Nescafé", category: "Café", price: 1.00, expiryDays: 26, qty: 14 },
]

type BoxSpec = { title: string; description: string; category: string; tipo: "solo" | "duo" | "familia"; stock: number; bestBeforeDays: number; items: string[] }

const BOXES: BoxSpec[] = [
  {
    title: "Caja Despensa",
    description: "Básicos de despensa por vencer, rescatados a mitad de precio.",
    category: "Abarrotes",
    tipo: "familia",
    stock: 8,
    bestBeforeDays: 3,
    items: ["Aceite Favorita 1lt", "Fideo Tallarín Doña Petrona 400g", "Salsa de tomate Maggi 200g", "Atún Real 160g", "Azúcar San Carlos 1kg"],
  },
  {
    title: "Caja Desayuno",
    description: "Café, leche y pan del día para arrancar la mañana.",
    category: "Desayuno",
    tipo: "duo",
    stock: 6,
    bestBeforeDays: 2,
    items: ["Café Don Café 40g", "Leche en funda Nutri 900ml", "Pan molde Blanco Supan 550g", "Chocolate Cocoa 160g"],
  },
]

function check(label: string, error: unknown) {
  if (error) { console.error(`✗ ${label}`, error); process.exit(1) }
}
function dateInDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
function inDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString() }

async function syncCatalog(stores: { id: string; name: string }[]) {
  const productRows = stores.flatMap((store) =>
    CATALOG.map((product) => {
      const slug = imageSlugFor(product.name)
      return {
        storeId: store.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        subcategory: product.promotion ?? null,
        cost: round2(product.price * 0.8),
        price: product.price,
        photoUrl: slug ? photoUrlFor(base, slug) : null,
      }
    }),
  )
  const { data: products, error: productError } = await admin
    .from("product")
    .upsert(productRows, { onConflict: "storeId,name" })
    .select("id,storeId,name")
  check("sync products", productError)

  const storeIds = stores.map((store) => store.id)
  const { data: existingLots, error: lotsError } = await admin.from("lot").select("id,productId,storeId").in("storeId", storeIds)
  check("load lots", lotsError)
  const lotIdByProduct = new Map((existingLots ?? []).map((lot) => [`${lot.storeId}|${lot.productId}`, lot.id]))
  const catalogByName = new Map(CATALOG.map((product) => [product.name, product]))
  const lotRows = (products ?? []).map((product) => {
    const catalogProduct = catalogByName.get(product.name)!
    const existingId = lotIdByProduct.get(`${product.storeId}|${product.id}`)
    return {
      ...(existingId ? { id: existingId } : {}),
      productId: product.id,
      storeId: product.storeId,
      qty: catalogProduct.qty,
      unitCost: round2(catalogProduct.price * 0.8),
      price: catalogProduct.price,
      expiryDate: dateInDays(catalogProduct.expiryDays),
    }
  })
  const lotsToUpdate = lotRows.filter((lot) => "id" in lot)
  const lotsToInsert = lotRows.filter((lot) => !("id" in lot))
  if (lotsToUpdate.length) check("sync existing lots", (await admin.from("lot").upsert(lotsToUpdate)).error)
  if (lotsToInsert.length) check("insert missing lots", (await admin.from("lot").insert(lotsToInsert)).error)

  let boxCovers = 0
  for (const store of stores) {
    for (const box of BOXES) {
      const photoUrl = boxImagePath(box.title)
      if (!photoUrl) continue
      const { data, error } = await admin
        .from("box")
        .update({ photoUrl })
        .eq("storeId", store.id)
        .eq("title", box.title)
        .select("id")
      check(`sync cover ${box.title} @ ${store.name}`, error)
      boxCovers += data?.length ?? 0
    }
  }

  console.log(`catalog sync done · ${products?.length ?? 0} products · ${lotRows.length} lots · ${boxCovers} box covers · reservations and reviews preserved`)
}

async function main() {
  const { data: stores, error: sErr } = await admin.from("store").select("id,name").order("createdAt")
  check("load stores", sErr)
  if (!stores?.length) { console.error("no stores found; run `npx tsx supabase/seed.ts` first"); process.exit(1) }

  const { data: authUsers, error: usersError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1_000 })
  check("load demo customer", usersError)
  let customerId = authUsers.users.find((user) => user.email === "cliente@rescat.ec")?.id ?? null
  if (!customerId) {
    const { data: customerProfiles } = await admin.from("profile").select("id").eq("role", "customer").order("createdAt").limit(1)
    customerId = customerProfiles?.[0]?.id ?? null
  }
  if (customerId) await admin.from("profile").update({ fullName: "Carlos Vera", phone: "0991234567" }).eq("id", customerId)

  if (process.argv.includes("--catalog-only")) {
    const catalogStores = stores.filter((store) => store.name === "Mini Market Juanita" || store.name === "Despensa Doña María")
    if (!catalogStores.length) { console.error("no real catalog stores found"); process.exit(1) }
    await syncCatalog(catalogStores)
    return
  }

  check("clear review", (await admin.from("review").delete().neq("id", ZERO)).error)
  check("clear reservation", (await admin.from("reservation").delete().neq("id", ZERO)).error)
  check("clear box_item", (await admin.from("box_item").delete().neq("id", ZERO)).error)
  check("clear box", (await admin.from("box").delete().neq("id", ZERO)).error)
  check("clear lot", (await admin.from("lot").delete().neq("id", ZERO)).error)
  check("clear product", (await admin.from("product").delete().neq("id", ZERO)).error)

  const productRows = stores.flatMap((s) =>
    CATALOG.map((p) => {
      const slug = imageSlugFor(p.name)
      return { storeId: s.id, name: p.name, brand: p.brand, category: p.category, subcategory: p.promotion ?? null, cost: round2(p.price * 0.8), price: p.price, photoUrl: slug ? photoUrlFor(base, slug) : null }
    })
  )
  const { data: products, error: pErr } = await admin.from("product").insert(productRows).select("id,storeId,name")
  check("insert products", pErr)
  const idOf = new Map(products!.map((p) => [`${p.storeId}|${p.name}`, p.id]))

  const lotRows = stores.flatMap((s) =>
    CATALOG.map((p) => ({
      productId: idOf.get(`${s.id}|${p.name}`)!, storeId: s.id, qty: p.qty,
      unitCost: round2(p.price * 0.8), price: p.price, expiryDate: dateInDays(p.expiryDays),
    }))
  )
  check("insert lots", (await admin.from("lot").insert(lotRows)).error)

  const priceByName = new Map(CATALOG.map((p) => [p.name, p.price]))
  let firstBoxId: string | null = null
  let firstStoreId: string | null = null
  let boxCount = 0

  for (const s of stores) {
    for (const b of BOXES) {
      const orig = round2(b.items.reduce((sum, n) => sum + (priceByName.get(n) ?? 0), 0))
      const price = round2(orig * 0.5)
      const boxPhoto = boxImagePath(b.title)
      const { data: box, error: bErr } = await admin.from("box").insert({
        storeId: s.id, title: b.title, description: b.description, items: b.items, category: b.category,
        originalPrice: orig, price, stockQty: b.stock, bestBefore: dateInDays(b.bestBeforeDays),
        pickupStart: inDays(0), pickupEnd: inDays(1), photoUrl: boxPhoto, status: "active", tipo: b.tipo,
      }).select("id").single()
      check(`insert box ${b.title} @ ${s.name}`, bErr)
      boxCount++
      const boxItemRows = b.items
        .map((n) => ({ boxId: box!.id, productId: idOf.get(`${s.id}|${n}`), qty: 1 }))
        .filter((r): r is { boxId: string; productId: string; qty: number } => Boolean(r.productId))
      check(`box_item ${b.title}`, (await admin.from("box_item").insert(boxItemRows)).error)
      if (!firstBoxId) { firstBoxId = box!.id; firstStoreId = s.id }
    }
  }

  if (customerId && firstBoxId && firstStoreId) {
    const { data: res, error: rErr } = await admin.rpc("reserve_box", { p_box_id: firstBoxId, p_customer_id: customerId, p_payment_method: "cashOnPickup" })
    check("demo reserve", rErr)
    await admin.from("reservation").update({ status: "pickedUp", pickedUpAt: new Date().toISOString() }).eq("id", res!.id)
    check("demo review", (await admin.from("review").insert({ reservationId: res!.id, boxId: firstBoxId, storeId: firstStoreId, customerId, rating: 5, comment: "Todo real y fresquito, gran ahorro. Vuelvo mañana." })).error)
  }

  console.log(`seed real done · ${products!.length} products · ${lotRows.length} lots · ${boxCount} boxes built from catalog`)
}
main()
