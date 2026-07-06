import { test, expect } from "@playwright/test"

test("customer logs in, reserves a box, and gets a code", async ({ page }) => {
  await page.goto("/login")
  await page.locator('input[type="email"]').fill("cliente@rescat.ec")
  await page.locator('input[type="password"]').fill("rescat123")
  await page.getByRole("button", { name: "Entrar" }).click()
  await page.waitForURL("/")
  await expect(page.getByRole("heading", { name: /Rescata comida/ })).toBeVisible()
  await page.locator("a[href^='/box/']").first().click()
  await page.getByRole("button", { name: "Reservar" }).click()
  await page.waitForURL(/\/reserve\//)
  await page.getByRole("button", { name: "Confirmar reserva" }).click()
  await expect(page.getByText(/RC-/).first()).toBeVisible()
})
