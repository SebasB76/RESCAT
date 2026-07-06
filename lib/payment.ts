export type PaymentMethod = "cashOnPickup" | "cardMock"

export async function processPayment(method: PaymentMethod, amount: number): Promise<{ ok: boolean }> {
  if (method === "cashOnPickup") return { ok: true }
  await new Promise((r) => setTimeout(r, 1000))
  return { ok: amount > 0 }
}
