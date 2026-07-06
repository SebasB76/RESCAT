"use server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"

export async function confirmPickup(reservationId: string) {
  const supabase = await createServerClient()
  const { error } = await supabase.from("reservation")
    .update({ status: "pickedUp", pickedUpAt: new Date().toISOString() })
    .eq("id", reservationId)
  if (error) throw new Error(error.message)
  revalidatePath("/merchant/reservations")
}
