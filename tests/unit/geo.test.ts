import { describe, it, expect } from "vitest"
import { distanceKm } from "@/lib/geo"

describe("distanceKm", () => {
  it("is ~0 for the same point", () => {
    expect(distanceKm(-2.17, -79.9, -2.17, -79.9)).toBeCloseTo(0, 5)
  })
  it("computes Urdesa↔Alborada as ~6km", () => {
    const d = distanceKm(-2.171, -79.902, -2.118, -79.901)
    expect(d).toBeGreaterThan(5)
    expect(d).toBeLessThan(7)
  })
})
