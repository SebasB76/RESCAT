import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

config({ path: ".env.local", quiet: true })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

describe("refresh_demo_boxes", () => {
  let ownerId = ""
  let storeId = ""
  let boxId = ""

  beforeAll(async () => {
    const stamp = Date.now()
    const { data: owner, error: ownerError } = await admin.auth.admin.createUser({
      email: `demo-refresh-${stamp}@example.com`,
      password: "rescat123",
      email_confirm: true,
    })
    if (ownerError || !owner.user) throw ownerError ?? new Error("owner_not_created")
    ownerId = owner.user.id

    const { data: store, error: storeError } = await admin.from("store").insert({
      ownerId,
      name: `Tienda recurrente ${stamp}`,
      address: "Guayaquil",
      lat: -2.17,
      lng: -79.92,
    }).select("id").single()
    if (storeError || !store) throw storeError ?? new Error("store_not_created")
    storeId = store.id

    const endedAt = Date.now() - 60 * 60_000
    const { data: box, error: boxError } = await admin.from("box").insert({
      storeId,
      title: `Caja recurrente ${stamp}`,
      items: ["Pan", "Fruta"],
      originalPrice: 10,
      price: 4,
      stockQty: 0,
      pickupStart: new Date(endedAt - 4 * 60 * 60_000).toISOString(),
      pickupEnd: new Date(endedAt).toISOString(),
      status: "soldOut",
    }).select("id").single()
    if (boxError || !box) throw boxError ?? new Error("box_not_created")
    boxId = box.id

    const { error: scheduleError } = await admin.from("demo_box_schedule").insert({
      boxId,
      dailyStockQty: 3,
    })
    if (scheduleError) throw scheduleError
  })

  afterAll(async () => {
    if (boxId) await admin.from("box").delete().eq("id", boxId)
    if (storeId) await admin.from("store").delete().eq("id", storeId)
    if (ownerId) await admin.auth.admin.deleteUser(ownerId)
  })

  it("moves only scheduled demo inventory to a future window", async () => {
    const { data: refreshed, error } = await admin.rpc("refresh_demo_boxes")
    expect(error).toBeNull()
    expect(refreshed).toBeGreaterThanOrEqual(1)

    const { data: box } = await admin
      .from("box")
      .select("status,stockQty,pickupStart,pickupEnd")
      .eq("id", boxId)
      .single()

    expect(box).toMatchObject({ status: "active", stockQty: 3 })
    expect(new Date(box!.pickupStart).getTime()).toBeLessThan(new Date(box!.pickupEnd).getTime())
    expect(new Date(box!.pickupEnd).getTime()).toBeGreaterThan(Date.now())
  })
})
