import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

const NAMES = ["María Fernanda Loor", "José Cedeño", "Gabriela Chávez", "Luis Mendoza", "Andrea Vera", "Kevin Zambrano", "Doménica Palma", "Ariel Macías"]
const COMMENTS = [
  "Excelente, todo fresquito y a súper precio. Vuelvo mañana.",
  "Muy buena caja, valió cada centavo. Recomendado.",
  "Todo en buen estado y la tienda súper amable en el retiro.",
  "Buenísima relación precio-calidad, me sorprendió lo que venía.",
  "Rescaté un montón de productos por poco. Genial la iniciativa.",
  "Retiro rápido con el código, sin problema. 100% otra vez.",
  "Productos de marca conocida, nada por vencer de inmediato. Feliz.",
  "La recomiendo: ayudás al planeta y ahorrás en la compra.",
  "Muy conforme, la atención fue rápida y amable.",
  "Buen surtido para la casa y súper económico.",
  "Cumple lo que promete. Ya la volví a reservar.",
  "Me hubiera gustado más variedad, pero por el precio está muy bien.",
]
const RATINGS = [5, 5, 4, 5, 4, 5, 3, 4, 5, 4]
const REVIEWS_PER_BOX = 5

function daysAgo(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString() }
function phoneFor(i: number) { return "09" + String(90000000 + i * 1234567).slice(0, 8) }
function check(label: string, error: unknown) { if (error) { console.error(`✗ ${label}`, error); process.exit(1) } }

async function main() {
  const { data: custProfiles } = await admin.from("profile").select("id, fullName").eq("role", "customer").order("createdAt").limit(8)
  const customers = custProfiles ?? []
  if (!customers.length) { console.error("no hay clientes; corré seed.ts primero"); process.exit(1) }

  for (let i = 0; i < customers.length; i++) {
    if (!customers[i].fullName) {
      await admin.from("profile").update({ fullName: NAMES[i % NAMES.length], phone: phoneFor(i) }).eq("id", customers[i].id)
    }
  }

  const { data: existing } = await admin.from("reservation").select("id").like("code", "RVW-%")
  if (existing?.length) {
    await admin.from("reservation").delete().like("code", "RVW-%")
  }

  const { data: boxItems } = await admin.from("box_item").select("boxId")
  const realBoxIds = new Set((boxItems ?? []).map((x) => x.boxId))
  const { data: allBoxes } = await admin.from("box").select("id, storeId, price, pickupEnd, status").eq("status", "active")
  const boxes = (allBoxes ?? []).filter((b) => realBoxIds.has(b.id))
  if (!boxes.length) { console.error("no hay cajas reales (con box_item) activas"); process.exit(1) }

  let seq = 0
  let total = 0
  for (let b = 0; b < boxes.length; b++) {
    const box = boxes[b]
    for (let r = 0; r < REVIEWS_PER_BOX; r++) {
      const customer = customers[(b * REVIEWS_PER_BOX + r) % customers.length]
      const rating = RATINGS[(b + r) % RATINGS.length]
      const comment = COMMENTS[(b * 3 + r) % COMMENTS.length]
      const when = daysAgo(2 + seq)
      seq++
      const code = `RVW-${String(seq).padStart(4, "0")}`
      const { data: resv, error: resErr } = await admin.from("reservation").insert({
        boxId: box.id, customerId: customer.id, code, paymentMethod: "cashOnPickup",
        status: "pickedUp", amount: box.price, reservedAt: when, expiresAt: box.pickupEnd, pickedUpAt: when,
      }).select("id").single()
      check(`reservation ${code}`, resErr)
      check(`review ${code}`, (await admin.from("review").insert({
        reservationId: resv!.id, boxId: box.id, storeId: box.storeId, customerId: customer.id, rating, comment, createdAt: when,
      })).error)
      total++
    }
  }

  console.log(`seed reviews done · ${total} reseñas en ${boxes.length} cajas`)
}
main()
