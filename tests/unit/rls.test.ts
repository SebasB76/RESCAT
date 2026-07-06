import { describe, it, expect, beforeAll } from "vitest"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
config({ path: ".env.local" })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function signedIn(email: string, password: string) {
  const c = createClient(url, anon)
  await c.auth.signInWithPassword({ email, password })
  return c
}

describe("RLS", () => {
  let victimBoxId: string
  const pw = "rls12345"
  const intruderEmail = `intruder${Date.now()}@t.co`

  beforeAll(async () => {
    const victim = await admin.auth.admin.createUser({ email: `victim${Date.now()}@t.co`, password: pw, email_confirm: true })
    await admin.from("profile").update({ role: "merchant" }).eq("id", victim.data.user!.id)
    const { data: store } = await admin.from("store").insert({ ownerId: victim.data.user!.id, name: "V", address: "x", lat: -2.1, lng: -79.9 }).select().single()
    const { data: box } = await admin.from("box").insert({ storeId: store!.id, title: "V", originalPrice: 2, price: 1, stockQty: 5, pickupStart: new Date().toISOString(), pickupEnd: new Date(Date.now() + 3600e3).toISOString() }).select().single()
    victimBoxId = box!.id
    const intruder = await admin.auth.admin.createUser({ email: intruderEmail, password: pw, email_confirm: true })
    await admin.from("profile").update({ role: "merchant" }).eq("id", intruder.data.user!.id)
  })

  it("a merchant cannot update another store's box", async () => {
    const c = await signedIn(intruderEmail, pw)
    const { data } = await c.from("box").update({ price: 0 }).eq("id", victimBoxId).select()
    expect(data?.length ?? 0).toBe(0)
    const { data: check } = await admin.from("box").select("price").eq("id", victimBoxId).single()
    expect(Number(check!.price)).toBe(1)
  })

  it("a customer cannot insert a review without a pickedUp reservation", async () => {
    const c = await signedIn("cliente@rescat.ec", "rescat123")
    const uid = (await c.auth.getUser()).data.user!.id
    const { error } = await c.from("review").insert({ reservationId: victimBoxId, storeId: victimBoxId, customerId: uid, rating: 5, comment: "x" })
    expect(error).not.toBeNull()
  })
})
