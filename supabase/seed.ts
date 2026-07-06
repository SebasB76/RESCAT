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
