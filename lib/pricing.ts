export const COMMISSION_RATE = 0.07

export type ReservationPricing = {
  subtotal: number
  commissionRate: number
  commissionAmount: number
  total: number
}

function cents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function reservationPricing(subtotal: number): ReservationPricing {
  const safeSubtotal = cents(Math.max(0, subtotal))
  const commissionAmount = cents(safeSubtotal * COMMISSION_RATE)
  return {
    subtotal: safeSubtotal,
    commissionRate: COMMISSION_RATE,
    commissionAmount,
    total: cents(safeSubtotal + commissionAmount),
  }
}

export function discountPercent(originalPrice: number, finalPrice: number) {
  if (!(originalPrice > 0)) return 0
  return Math.max(0, Math.round((1 - finalPrice / originalPrice) * 100))
}
