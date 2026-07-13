import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { readFileSync } from "node:fs"
config({ path: ".env.local" })

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const ZERO = "00000000-0000-0000-0000-000000000000"
const round2 = (n: number) => Math.round(n * 100) / 100

type LegacyCatalogProduct = {
  prod: string; marca: string | null; cat: string; subcat: string | null
  costo: number; precio_venta: number; tienda_jua: boolean; tienda_mar: boolean
}
type LegacyStock = {
  tienda: string; prod: string; marca: string | null; cat: string; subcat: string | null
  costo: number; precio_venta: number; qty: number; dias: number; f_ing: string
}
type LegacySales = {
  kpis: { ventas_total: number; n_pedidos: number; n_clientes: number }
  ventas_cat: { cat: string; ventas: number; qty: number }[]
  tendencia: { mes: string; ventas: number }[]
  top_prods: { prod: string; marca: string | null; ventas: number; qty: number }[]
}
type LegacyBasketRule = {
  a: string; b: string; cat_a: string; cat_b: string
  freq: number; conf_ab: number; conf_ba: number; lift: number
}
type ProductSeed = {
  storeId: string; name: string; brand: string | null; category: string
  subcategory: string | null; cost: number; price: number
}

function loadConsts(path: string): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^const (\w+)=(.*);\s*$/)
    if (!m) continue
    const [, name, json] = m
    if (json === "null") { out[name] = null; continue }
    try { out[name] = JSON.parse(json) } catch { out[name] = null }
  }
  return out
}

function dateInDays(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10)
}

function check(label: string, error: unknown) {
  if (error) { console.error(`✗ ${label}`, error); process.exit(1) }
}

async function main() {
  const store = loadConsts("legacy/rescat_store.js")
  const data = loadConsts("legacy/rescat_data.js")
  const CATALOGO = (store.CATALOGO ?? []) as LegacyCatalogProduct[]
  const stock = ((data.DATA as { stock?: LegacyStock[] } | undefined)?.stock ?? [])
  const VENTAS = data.VENTAS_DATA as Record<string, LegacySales>
  const MB = data.MB_DATA as Record<string, LegacyBasketRule[]>

  const { data: stores, error: sErr } = await admin.from("store").select("id,name")
  check("load stores", sErr)
  const jua = stores!.find((s) => s.name.includes("Juanita"))!.id
  const mar = stores!.find((s) => s.name.includes("Despensa"))!.id
  const storeOf = (tienda: string) => (tienda.includes("Juanita") ? jua : mar)
  const scopeStore: Record<string, string | null> = { todas: null, juanita: jua, maria: mar }

  const marginOf = (cost: number, price: number) => (price > 0 ? Math.max(0, (price - cost) / price) : 0)
  const prodMargin = new Map<string, number>()
  const catAgg = new Map<string, { sum: number; n: number }>()
  let allSum = 0, allN = 0
  for (const c of CATALOGO) {
    const m = marginOf(c.costo, c.precio_venta)
    prodMargin.set(c.prod, m)
    const a = catAgg.get(c.cat) ?? { sum: 0, n: 0 }
    a.sum += m; a.n += 1; catAgg.set(c.cat, a)
    allSum += m; allN += 1
  }
  const overallMargin = allN ? allSum / allN : 0.22
  const catMargin = (cat: string) => { const a = catAgg.get(cat); return a && a.n ? a.sum / a.n : overallMargin }

  check("clear lot", (await admin.from("lot").delete().neq("id", ZERO)).error)
  check("clear product", (await admin.from("product").delete().neq("id", ZERO)).error)
  for (const t of ["sales_kpi", "category_sales", "monthly_sales", "top_product", "basket_rule"]) {
    check(`clear ${t}`, (await admin.from(t).delete().neq("id", ZERO)).error)
  }

  const JUANITA_ONLY = new Set([
    "Gaseosa Sabor Naranja 2L", "Jugo de Naranja 1L", "Barra de Chocolate con Leche",
    "Galletas de Chocolate", "Papas Fritas Clásicas", "Chifles Salados", "Pan Integral",
    "Salsa de Soya 150ml", "Mermelada de Frutimora 285g", "Sal Yodada 1kg",
    "Fideos Tallarín 400g", "Harina de Trigo 1kg", "Mantequilla con Sal 250g",
    "Salchichas de Pollo", "Mortadela 500 g", "Salami Italiano 150g",
  ])
  const MARIA_ONLY = new Set([
    "Carne de Res Molida 500g", "Pechuga de Pollo sin Piel 1kg", "Chuleta de Cerdo 500g",
    "Champiñones Tajados 400g", "Tomate Riñón 1kg", "Cebolla Paiteña 1kg", "Papas Chola 2kg",
    "Plátano Verde x5", "Limón Sutil 1kg", "Queso Fresco 500g", "Queso Mozzarella 500g",
    "Leche Descremada 1L", "Frejol Rojo bajo en sal 425g", "Lentejas 425g",
    "Maíz Dulce en Lata", "Sardinas en Salsa de Tomate",
  ])
  const allowedStore = (storeId: string, name: string) =>
    !(storeId === jua && MARIA_ONLY.has(name)) && !(storeId === mar && JUANITA_ONLY.has(name))
  const isShared = (name: string) => !JUANITA_ONLY.has(name) && !MARIA_ONLY.has(name)

  const prodMap = new Map<string, ProductSeed>()
  const addProd = (storeId: string, p: Omit<ProductSeed, "storeId">) => {
    if (!allowedStore(storeId, p.name)) return
    const key = `${storeId}|${p.name}`
    const price = storeId === jua && isShared(p.name) ? round2(p.price * 1.05) : p.price
    if (!prodMap.has(key)) prodMap.set(key, { storeId, name: p.name, brand: p.brand, category: p.category, subcategory: p.subcategory, cost: p.cost, price })
  }
  for (const c of CATALOGO) {
    const base = { name: c.prod, brand: c.marca, category: c.cat, subcategory: c.subcat, cost: c.costo, price: c.precio_venta }
    if (c.tienda_jua) addProd(jua, base)
    if (c.tienda_mar) addProd(mar, base)
  }
  for (const s of stock) {
    addProd(storeOf(s.tienda), { name: s.prod, brand: s.marca, category: s.cat, subcategory: s.subcat, cost: s.costo, price: s.precio_venta })
  }

  const { data: products, error: pErr } = await admin.from("product").insert([...prodMap.values()]).select("id,storeId,name")
  check("insert products", pErr)
  const idOf = new Map(products!.map((p) => [`${p.storeId}|${p.name}`, p.id]))

  const lotRows = stock.map((s) => {
    const storeId = storeOf(s.tienda)
    return { productId: idOf.get(`${storeId}|${s.prod}`), storeId, qty: s.qty, unitCost: s.costo, price: s.precio_venta, expiryDate: dateInDays(s.dias), receivedAt: s.f_ing }
  }).filter((l) => l.productId)
  check("insert lots", (await admin.from("lot").insert(lotRows)).error)

  for (const [scope, storeId] of Object.entries(scopeStore)) {
    const v = VENTAS[scope]
    const gananciaTotal = round2(v.ventas_cat.reduce((sum, row) => sum + row.ventas * catMargin(row.cat), 0))
    check(`sales_kpi ${scope}`, (await admin.from("sales_kpi").insert({ storeId, ventasTotal: v.kpis.ventas_total, gananciaTotal, nPedidos: v.kpis.n_pedidos, nClientes: v.kpis.n_clientes })).error)
    check(`category_sales ${scope}`, (await admin.from("category_sales").insert(v.ventas_cat.map((row) => ({ storeId, category: row.cat, sales: row.ventas, profit: round2(row.ventas * catMargin(row.cat)), qty: row.qty })))).error)
    check(`monthly_sales ${scope}`, (await admin.from("monthly_sales").insert(v.tendencia.map((row) => ({ storeId, month: row.mes, sales: row.ventas, profit: round2(row.ventas * overallMargin) })))).error)
    check(`top_product ${scope}`, (await admin.from("top_product").insert(v.top_prods.map((row, index) => ({ storeId, rank: index + 1, name: row.prod, brand: row.marca, sales: row.ventas, profit: round2(row.ventas * (prodMargin.get(row.prod) ?? overallMargin)), qty: row.qty })))).error)
    check(`basket_rule ${scope}`, (await admin.from("basket_rule").insert(MB[scope].map((row) => ({ storeId, a: row.a, b: row.b, catA: row.cat_a, catB: row.cat_b, freq: row.freq, confAB: row.conf_ab, confBA: row.conf_ba, lift: row.lift })))).error)
  }

  check("box tipo duo", (await admin.from("box").update({ tipo: "duo" }).ilike("title", "%desayuno%")).error)
  check("box tipo familia", (await admin.from("box").update({ tipo: "familia" }).ilike("title", "%frutas%")).error)

  console.log(`seed slice2 done · ${products!.length} products · ${lotRows.length} lots · margins applied · analytics for todas/juanita/maria`)
}
main()
