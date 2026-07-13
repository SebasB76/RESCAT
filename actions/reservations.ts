"use server"
import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import type { PaymentMethod } from "@/lib/payment"

export async function confirmPickup(reservationId: string) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { data: updated, error } = await supabase.from("reservation")
    .update({ status: "pickedUp", pickedUpAt: new Date().toISOString() })
    .eq("id", reservationId)
    .in("status", ["reserved", "paid"])
    .select("id,status")
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!updated) throw new Error("not_authorized_or_already_processed")
  revalidatePath("/merchant/reservations")
  revalidatePath("/reservations")
}

export async function reserveBox(boxId: string, paymentMethod: PaymentMethod) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")
  const { data, error } = await supabase.rpc("reserve_box", {
    p_box_id: boxId, p_customer_id: user.id, p_payment_method: paymentMethod,
  })
  if (error) throw new Error(error.message.includes("out_of_stock") ? "out_of_stock" : error.message)
  revalidatePath("/")
  return data
}
