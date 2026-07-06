import { describe, it, expect } from "vitest"
import { processPayment } from "@/lib/payment"

describe("processPayment", () => {
  it("cashOnPickup approves immediately", async () => {
    expect(await processPayment("cashOnPickup", 5)).toEqual({ ok: true })
  })
  it("cardMock approves a positive amount", async () => {
    expect(await processPayment("cardMock", 5)).toEqual({ ok: true })
  })
})
