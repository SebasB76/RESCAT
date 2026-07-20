import { describe, expect, it } from "vitest"
import { discountPercent, reservationPricing } from "@/lib/pricing"

describe("reservationPricing", () => {
  it("adds a visible 7% commission and rounds to cents", () => {
    expect(reservationPricing(2.25)).toEqual({
      subtotal: 2.25,
      commissionRate: 0.07,
      commissionAmount: 0.16,
      total: 2.41,
    })
  })

  it("calculates the advertised discount against the final customer total", () => {
    expect(discountPercent(5.02, reservationPricing(2.25).total)).toBe(52)
  })

  it("never returns a negative price or discount", () => {
    expect(reservationPricing(-4).total).toBe(0)
    expect(discountPercent(5, 6)).toBe(0)
  })
})
