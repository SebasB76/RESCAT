"use server"
import { createServerClient } from "@/lib/supabase/server"
import { type PaymentMethod } from "@/lib/payment"

export type OrderItemInput = {
  productId: string
  qty: number
}

export type OrderInput = {
  paymentMethod: PaymentMethod
  items: OrderItemInput[]
}

export type OrderResult = {
  storeId: string
  code: string
  total: number
}

export async function createOrder(input: OrderInput): Promise<OrderResult[]> {
  const { paymentMethod, items } = input
  if (!items.length) throw new Error("empty_cart")

  const supabase = await createServerClient()
  const payload = items.map((i) => ({ productId: i.productId, qty: i.qty }))
  const { data, error } = await supabase.rpc("create_order", { p_items: payload, p_payment_method: paymentMethod })
  if (error) throw new Error(error.message)
  return (data as unknown as OrderResult[]) ?? []
}
