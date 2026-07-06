"use server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"

export type BoxInput = {
  title: string; description: string; items: string[]; category: string
  originalPrice: number; price: number; stockQty: number
  bestBefore: string; pickupStart: string; pickupEnd: string; photoUrl: string | null
}

export async function createBox(input: BoxInput) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: store } = await supabase.from("store").select("id").eq("ownerId", user!.id).limit(1).single()
  const { error } = await supabase.from("box").insert({ ...input, storeId: store!.id, status: "active" })
  if (error) throw new Error(error.message)
  revalidatePath("/merchant")
  redirect("/merchant")
}

export async function updateBox(id: string, input: BoxInput) {
  const supabase = await createServerClient()
  const { error } = await supabase.from("box").update(input).eq("id", id)
  if (error) throw new Error(error.message)
  revalidatePath("/merchant")
  redirect("/merchant")
}
