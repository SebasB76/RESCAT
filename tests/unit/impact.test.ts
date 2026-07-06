import { describe, it, expect } from "vitest"
import { foodKgSaved, co2KgSaved, totalKgSaved, totalCo2Saved } from "@/lib/impact"

describe("impact estimates", () => {
  it("maps box type to estimated food kg", () => {
    expect(foodKgSaved("solo")).toBe(1.0)
    expect(foodKgSaved("duo")).toBe(2.0)
    expect(foodKgSaved("familia")).toBe(3.5)
  })

  it("derives co2 from food kg", () => {
    expect(co2KgSaved("solo")).toBe(2.5)
    expect(co2KgSaved("familia")).toBe(8.8)
  })

  it("sums estimates across boxes", () => {
    expect(totalKgSaved(["solo", "duo", "familia"])).toBe(6.5)
    expect(totalCo2Saved(["solo", "duo"])).toBe(7.5)
  })

  it("falls back to duo for an unknown type", () => {
    expect(foodKgSaved("mystery" as unknown as "duo")).toBe(2.0)
  })
})
