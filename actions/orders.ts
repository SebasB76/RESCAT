"use server"
import { createServerClient } from "@/lib/supabase/server"
import { processPayment, type PaymentMethod } from "@/lib/payment"

export type OrderItemInput = {
  productId: string
  storeId: string
  qty: number
  price: number
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

function orderCode() {
  return "PC-" + Math.floor(Math.random() * 0x1000000).toString(16).toUpperCase().padStart(6, "0")
}

export async function createOrder(input: OrderInput): Promise<OrderResult[]> {
  const { paymentMethod, items } = input
  if (!items.length) throw new Error("empty_cart")

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("not_authenticated")

  const total = items.reduce((s, i) => s + i.price * i.qty, 0)
  if (paymentMethod === "cardMock") {
    const pay = await processPayment("cardMock", total)
    if (!pay.ok) throw new Error("payment_failed")
  }

  const byStore = new Map<string, OrderItemInput[]>()
  for (const it of items) {
    const list: OrderItemInput[] = byStore.get(it.storeId) ?? []
    list.push(it)
    byStore.set(it.storeId, list)
  }

  const status = paymentMethod === "cardMock" ? "paid" : "pending"
  const results: OrderResult[] = []

  for (const [storeId, storeItems] of Array.from(byStore.entries())) {
    const storeTotal = storeItems.reduce((s, i) => s + i.price * i.qty, 0)
    const code = orderCode()
    const { data: purchase, error: purchaseError } = await supabase
      .from("purchase")
      .insert({ customerId: user.id, storeId, paymentMethod, code, total: storeTotal, status })
      .select("id")
      .single()
    if (purchaseError || !purchase) throw new Error(purchaseError?.message ?? "purchase_failed")

    const rows = storeItems.map((i) => ({
      purchaseId: purchase.id,
      productId: i.productId,
      qty: i.qty,
      price: i.price,
    }))
    const { error: itemsError } = await supabase.from("purchase_item").insert(rows)
    if (itemsError) throw new Error(itemsError.message)

    results.push({ storeId, code, total: storeTotal })
  }

  return results
}
