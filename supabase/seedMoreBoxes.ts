import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const round2 = (n: number) => Math.round(n * 100) / 100
const DESAYUNO = "/cajas/caja-desayuno.webp"
const DESPENSA = "/cajas/caja-despensa.webp"

function dateInDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10) }
function inDays(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString() }
function check(label: string, error: unknown) { if (error) { console.error(`✗ ${label}`, error); process.exit(1) } }

type Tipo = "solo" | "duo" | "familia"
type Recipe = { store: "Juanita" | "María"; title: string; tipo: Tipo; stock: number; cover: string; items: string[] }

const RENAMES: { store: "Juanita" | "María"; from: string; to: string }[] = [
  { store: "María", from: "Caja Despensa", to: "Caja Alacena" },
  { store: "María", from: "Caja Desayuno", to: "Caja Mañanera" },
]

const RECIPES: Recipe[] = [
  { store: "Juanita", title: "Caja Enlatados", tipo: "familia", stock: 6, cover: DESPENSA, items: ["Atún Real 160g", "Atún Isabel 160g", "Sardina Real 156g", "Choclo dulce Facundo 425g"] },
  { store: "Juanita", title: "Caja Cafetera", tipo: "duo", stock: 5, cover: DESAYUNO, items: ["Café Don Café 40g", "Café Nescafé tradicional 160g", "Chocolate Cocoa 160g", "Leche en Cartón Trú entera 1lt"] },
  { store: "Juanita", title: "Caja Básicos", tipo: "familia", stock: 8, cover: DESPENSA, items: ["Sal 1kg", "Azúcar San Carlos 1kg", "Aceite Favorita 1lt", "Fideo Tallarín Doña Petrona 200g"] },
  { store: "María", title: "Caja Cocina", tipo: "familia", stock: 6, cover: DESPENSA, items: ["Aceite Girasol 1lt", "Fideo Tallarín Doña Petrona 400g", "Salsa de tomate Maggi 200g", "Sazón Maggi 200g"] },
  { store: "María", title: "Caja Panadería", tipo: "duo", stock: 5, cover: DESAYUNO, items: ["Pan molde Blanco Supan 550g", "Pan Blanco sin corteza Supan 550g", "Rapiditas medianas 250g"] },
  { store: "María", title: "Caja Merienda", tipo: "duo", stock: 6, cover: DESAYUNO, items: ["Leche en funda Reyleche 900ml", "Chocolate Cocoa 160g", "Café Oro 40g"] },
]

async function main() {
  const { data: stores } = await admin.from("store").select("id, name")
  const storeId = (key: "Juanita" | "María") => (stores ?? []).find((s) => s.name.includes(key))?.id
  const jua = storeId("Juanita")
  const mar = storeId("María")
  if (!jua || !mar) { console.error("no encuentro las tiendas Juanita/María"); process.exit(1) }

  const { data: prods } = await admin.from("product").select("id, name, storeId, price")
  const prod = (sid: string, name: string) => (prods ?? []).find((p) => p.storeId === sid && p.name === name)

  for (const rn of RENAMES) {
    const sid = storeId(rn.store)!
    check(`rename ${rn.from}->${rn.to}`, (await admin.from("box").update({ title: rn.to }).eq("storeId", sid).eq("title", rn.from)).error)
  }

  const newNames = RECIPES.map((r) => r.title)
  await admin.from("box").delete().in("title", newNames)

  let created = 0
  for (const r of RECIPES) {
    const sid = r.store === "Juanita" ? jua : mar
    const rows = r.items.map((n) => prod(sid, n)).filter(Boolean) as { id: string; name: string; price: number }[]
    if (rows.length !== r.items.length) { console.error(`✗ ${r.title}: faltan productos`, r.items.filter((n) => !prod(sid, n))); process.exit(1) }
    const orig = round2(rows.reduce((s, p) => s + Number(p.price), 0))
    const price = round2(orig * 0.5)
    const { data: box, error } = await admin.from("box").insert({
      storeId: sid, title: r.title, description: `Selección rescatada de ${r.store === "Juanita" ? "Mini Market Juanita" : "Despensa Doña María"}.`,
      items: rows.map((p) => p.name), category: "Abarrotes", originalPrice: orig, price, stockQty: r.stock,
      bestBefore: dateInDays(3), pickupStart: inDays(0), pickupEnd: inDays(1), photoUrl: r.cover, status: "active", tipo: r.tipo,
    }).select("id").single()
    check(`insert ${r.title}`, error)
    check(`box_item ${r.title}`, (await admin.from("box_item").insert(rows.map((p) => ({ boxId: box!.id, productId: p.id, qty: 1 })))).error)
    created++
  }

  console.log(`seed more boxes done · ${RENAMES.length} renombradas · ${created} cajas nuevas`)
}
main()
