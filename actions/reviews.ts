"use server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function submitReview(reservationId: string, rating: number, comment: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { data: res } = await supabase.from("reservation").select("boxId, box(storeId)").eq("id", reservationId).single()
  if (!res) throw new Error("not_found")
  const box = res.box as unknown as { storeId: string }
  const { error } = await supabase.from("review").insert({ reservationId, boxId: res.boxId, storeId: box.storeId, customerId: user.id, rating, comment })
  if (error) throw new Error(error.message)
  revalidatePath("/reservations")
}
