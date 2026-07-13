"use server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function submitReview(reservationId: string, rating: number, comment: string) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("invalid_rating")
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { data: res } = await supabase.from("reservation").select("boxId, box(storeId)").eq("id", reservationId).single()
  if (!res) throw new Error("not_found")
  const box = res.box as unknown as { storeId: string }
  const { error } = await supabase.from("review").insert({ reservationId, boxId: res.boxId, storeId: box.storeId, customerId: user.id, rating, comment: comment.trim().slice(0, 500) })
  if (error) throw new Error(error.message)
  revalidatePath("/reservations")
  revalidatePath(`/box/${res.boxId}`)
  revalidatePath("/")
}
