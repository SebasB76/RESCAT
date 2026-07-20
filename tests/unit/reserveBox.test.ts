import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

describe("reserve_box", () => {
  let boxId: string
  let customerId: string
  let ownerId: string
  let storeId: string

  beforeAll(async () => {
    const { data: u } = await admin.auth.admin.createUser({ email: `t${Date.now()}@t.co`, password: "x1234567", email_confirm: true })
    customerId = u.user!.id
    const { data: owner } = await admin.auth.admin.createUser({ email: `o${Date.now()}@t.co`, password: "x1234567", email_confirm: true })
    ownerId = owner.user!.id
    const { data: store } = await admin.from("store").insert({ ownerId: owner.user!.id, name: "T", address: "A", lat: -2.17, lng: -79.9 }).select().single()
    storeId = store!.id
    const { data: box } = await admin.from("box").insert({ storeId: store!.id, title: "T", items: ["Pan", "Leche"], originalPrice: 10, price: 5, stockQty: 3, pickupStart: new Date().toISOString(), pickupEnd: new Date(Date.now() + 3600e3).toISOString() }).select().single()
    boxId = box!.id
  })

  afterAll(async () => {
    if (boxId) await admin.from("reservation").delete().eq("boxId", boxId)
    if (boxId) await admin.from("box").delete().eq("id", boxId)
    if (storeId) await admin.from("store").delete().eq("id", storeId)
    if (customerId) await admin.auth.admin.deleteUser(customerId)
    if (ownerId) await admin.auth.admin.deleteUser(ownerId)
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

    const { data: reservations } = await admin
      .from("reservation")
      .select("id,amount,subtotal,commissionRate,commissionAmount,total")
      .eq("boxId", boxId)
    expect(reservations).toHaveLength(3)
    for (const reservation of reservations ?? []) {
      expect(reservation).toMatchObject({
        amount: 5,
        subtotal: 5,
        commissionRate: 0.07,
        commissionAmount: 0.35,
        total: 5.35,
      })
    }

    const reservationIds = (reservations ?? []).map((reservation) => reservation.id)
    const { data: snapshots } = await admin
      .from("reservation_item")
      .select("reservationId,name,qty")
      .in("reservationId", reservationIds)
    expect(snapshots).toHaveLength(6)
    expect(snapshots?.map((item) => item.name).sort()).toEqual([
      "Leche", "Leche", "Leche", "Pan", "Pan", "Pan",
    ])
  })
})
