"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export type BoxProduct = { productId: string; qty: number }

export type BoxInput = {
  title: string; description: string; items: string[]; category: string
  originalPrice: number; price: number; stockQty: number
  bestBefore: string; pickupStart: string; pickupEnd: string; photoUrl: string | null
  products: BoxProduct[]
}

export async function createBox(input: BoxInput) {
  if (input.originalPrice <= 0 || input.price < 0 || input.price > input.originalPrice) throw new Error("invalid_price")
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user!.id).order("createdAt", { ascending: true }).limit(1)
  if (!stores?.length) throw new Error("no_store")
  const storeId = stores[0].id
  const { products, ...boxFields } = input
  const { data: box, error } = await supabase.from("box").insert({ ...boxFields, storeId, status: "active" }).select("id").single()
  if (error) throw new Error(error.message)
  if (products.length) {
    const { error: itemsError } = await supabase.from("box_item").insert(products.map((p) => ({ boxId: box.id, productId: p.productId, qty: p.qty })))
    if (itemsError) throw new Error(itemsError.message)
  }
  revalidatePath("/merchant")
  redirect("/merchant")
}

export async function updateBox(id: string, input: BoxInput) {
  if (input.originalPrice <= 0 || input.price < 0 || input.price > input.originalPrice) throw new Error("invalid_price")
  const supabase = await createServerClient()
  const { products, ...boxFields } = input
  const { error } = await supabase.from("box").update(boxFields).eq("id", id)
  if (error) throw new Error(error.message)
  await supabase.from("box_item").delete().eq("boxId", id)
  if (products.length) {
    const { error: itemsError } = await supabase.from("box_item").insert(products.map((p) => ({ boxId: id, productId: p.productId, qty: p.qty })))
    if (itemsError) throw new Error(itemsError.message)
  }
  revalidatePath("/merchant")
  redirect("/merchant")
}
