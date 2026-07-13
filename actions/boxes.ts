"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export type BoxProduct = { productId: string; qty: number }

export type BoxInput = {
  title: string; description: string; items: string[]; category: string
  tipo: "solo" | "duo" | "familia"
  originalPrice: number; price: number; stockQty: number
  bestBefore: string; pickupStart: string; pickupEnd: string; photoUrl: string | null
  products: BoxProduct[]
}

function validateBox(input: BoxInput) {
  if (!input.title.trim() || !input.category.trim()) throw new Error("invalid_details")
  if (!(["solo", "duo", "familia"] as const).includes(input.tipo)) throw new Error("invalid_type")
  if (!input.items.length) throw new Error("invalid_contents")
  if (!Number.isFinite(input.originalPrice) || !Number.isFinite(input.price) || input.originalPrice <= 0 || input.price < 0 || input.price > input.originalPrice) throw new Error("invalid_price")
  if (!Number.isInteger(input.stockQty) || input.stockQty < 1) throw new Error("invalid_stock")
  const pickupStart = Date.parse(input.pickupStart)
  const pickupEnd = Date.parse(input.pickupEnd)
  if (!Number.isFinite(pickupStart) || !Number.isFinite(pickupEnd) || pickupEnd <= pickupStart) throw new Error("invalid_pickup")
  if (input.products.some((product) => !product.productId || !Number.isInteger(product.qty) || product.qty < 1)) throw new Error("invalid_products")
}

export async function createBox(input: BoxInput) {
  validateBox(input)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user.id).order("createdAt", { ascending: true }).limit(1)
  if (!stores?.length) throw new Error("no_store")
  const storeId = stores[0].id
  const { products, ...boxFields } = input
  const { data: box, error } = await supabase.from("box").insert({ ...boxFields, storeId, status: "active" }).select("id").single()
  if (error) throw new Error(error.message)
  if (products.length) {
    const { error: itemsError } = await supabase.from("box_item").insert(products.map((p) => ({ boxId: box.id, productId: p.productId, qty: p.qty })))
    if (itemsError) throw new Error(itemsError.message)
  }
  revalidatePath("/merchant/boxes")
  redirect("/merchant/boxes")
}

export async function updateBox(id: string, input: BoxInput) {
  validateBox(input)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user.id)
  const storeIds = (stores ?? []).map((store) => store.id)
  if (!storeIds.length) throw new Error("no_store")
  const { products, ...boxFields } = input
  const { data: updated, error } = await supabase.from("box").update(boxFields).eq("id", id).in("storeId", storeIds).select("id").maybeSingle()
  if (error) throw new Error(error.message)
  if (!updated) throw new Error("not_authorized")
  await supabase.from("box_item").delete().eq("boxId", id)
  if (products.length) {
    const { error: itemsError } = await supabase.from("box_item").insert(products.map((p) => ({ boxId: id, productId: p.productId, qty: p.qty })))
    if (itemsError) throw new Error(itemsError.message)
  }
  revalidatePath("/merchant/boxes")
  redirect("/merchant/boxes")
}
