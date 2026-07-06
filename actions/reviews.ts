"use server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function submitReview(reservationId: string, storeId: string, rating: number, comment: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { error } = await supabase.from("review").insert({ reservationId, storeId, customerId: user.id, rating, comment })
  if (error) throw new Error(error.message)
  revalidatePath("/reservations")
}
