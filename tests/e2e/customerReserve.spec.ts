import { expect, test } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

config({ path: ".env.local", quiet: true })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

let fixtureBoxId: string

test.describe.configure({ mode: "serial" })

test.beforeAll(async () => {
  const { data: stores } = await admin.from("store").select("id").limit(1)
  if (!stores?.[0]) throw new Error("test_store_not_found")
  const now = Date.now()
  const { data: box, error } = await admin.from("box").insert({
    storeId: stores[0].id,
    title: `Caja sorpresa E2E ${now}`,
    description: "Caja temporal para validar el recorrido del cliente.",
    category: "Panadería",
    tipo: "duo",
    items: ["Pan", "Leche", "Fruta"],
    originalPrice: 12,
    price: 5,
    stockQty: 8,
    pickupStart: new Date(now - 60_000).toISOString(),
    pickupEnd: new Date(now + 4 * 60 * 60_000).toISOString(),
    status: "active",
  }).select("id").single()
  if (error || !box) throw error ?? new Error("test_box_not_created")
  fixtureBoxId = box.id
})

test.afterAll(async () => {
  if (fixtureBoxId) await admin.from("box").delete().eq("id", fixtureBoxId)
})

async function login(page: import("@playwright/test").Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill("rescat123")
  await page.getByRole("button", { name: "Entrar con correo" }).click()
  await page.waitForURL((url) => url.pathname === next)
}

test("una reserva anónima muestra acceso contextual sin perder la caja", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Cajas sorpresa con comida buena. A precio de rescate." })).toBeVisible()
  const firstBox = page.locator("#cajas a[href^='/?box=']").first()
  await expect(firstBox).toBeVisible()
  await expect(firstBox).toContainText(/−\d+%/)
  await expect(firstBox).toContainText("incluye comisión 7%")
  await expect(firstBox.locator("img")).toHaveAttribute("src", /cajas%2Fcaja-(desayuno|despensa)\.webp/)
  await firstBox.click()
  const boxDialog = page.getByRole("dialog", { name: "Detalle de caja" })
  await expect(boxDialog).toBeVisible()
  await expect(boxDialog.getByText("Comisión RESCAT · 7%")).toBeVisible()
  await expect(boxDialog.getByText("Total a pagar")).toBeVisible()
  await boxDialog.getByRole("button", { name: /Tarjeta/ }).click()
  await expect(boxDialog.getByLabel("Número de tarjeta")).toBeVisible()
  await expect(boxDialog.getByText("Comisión RESCAT · 7%")).toBeVisible()
  await page.getByRole("button", { name: /Confirmar reserva/ }).click()
  await expect(page.getByRole("heading", { name: "Entra para reservar esta caja" })).toBeVisible()
  await expect(page.getByText("La caja seguirá esperándote aquí.")).toBeVisible()
  const authPanel = boxDialog.locator("section[aria-labelledby='auth-prompt-title']")
  const enterLink = boxDialog.getByRole("link", { name: "Entrar" })
  const signupLink = boxDialog.getByRole("link", { name: "Crear cuenta" })
  const [panelBackground, enterBackground, signupColor] = await Promise.all([
    authPanel.evaluate((element) => getComputedStyle(element).backgroundColor),
    enterLink.evaluate((element) => getComputedStyle(element).backgroundColor),
    signupLink.evaluate((element) => getComputedStyle(element).color),
  ])
  expect(enterBackground).not.toBe(panelBackground)
  expect(signupColor).not.toBe(panelBackground)
})

test("la experiencia del cliente ofrece cajas, no productos individuales", async ({ page }) => {
  await page.goto("/")
  await expect(page.locator("#cajas")).toBeVisible()
  await expect(page.locator("#catalogo")).toHaveCount(0)
  await expect(page.getByLabel("Abrir carrito")).toHaveCount(0)
  await expect(page.getByRole("button", { name: /Agregar/ })).toHaveCount(0)
})

test("el mapa web permite seleccionar cajas y abrir su detalle", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("button", { name: "Mapa" })).toBeVisible()
  await page.getByRole("button", { name: "Mapa" }).click()
  await expect(page.getByRole("region", { name: "Mapa de cajas cercanas" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Cajas en el mapa" })).toBeVisible()
  await page.getByRole("button", { name: /Caja/ }).first().click()
  await expect(page.getByRole("link", { name: /Ver y reservar/ })).toBeVisible()
})

test("la tienda crea una caja mediante un asistente guiado", async ({ page }) => {
  await login(page, "tienda@rescat.ec", "/merchant/boxes/new")
  await expect(page.getByRole("heading", { name: "Presenta tu caja" })).toBeVisible()
  await page.getByLabel("Nombre de la caja").fill("Caja prueba guiada")
  await page.getByLabel("Categoría principal").fill("Panadería")
  await page.getByRole("button", { name: /Continuar/ }).click()
  await expect(page.getByRole("heading", { name: "Cuenta qué puede incluir" })).toBeVisible()
  await page.locator('input[type="checkbox"]').first().check()
  await page.getByRole("button", { name: /Continuar/ }).click()
  await expect(page.getByRole("heading", { name: "Define el valor del rescate" })).toBeVisible()
})

test("el alta de tienda guía desde la cuenta hasta los datos del negocio", async ({ page }) => {
  await page.goto("/signup")
  await page.getByRole("button", { name: "Soy tienda" }).click()
  await expect(page.getByRole("heading", { name: "Activa tu tienda" })).toBeVisible()
  await page.getByLabel("Nombre del encargado").fill("Encargada Rescat")
  await page.getByLabel("Correo").fill("encargada@example.com")
  await page.getByLabel("Contraseña").fill("rescat123")
  await page.getByRole("button", { name: /Continuar/ }).click()
  await expect(page.getByLabel("Nombre de la tienda")).toBeVisible()
  await page.getByLabel("Nombre de la tienda").fill("Tienda del Barrio")
  await page.getByLabel("Dirección").fill("Urdesa Central, Guayaquil")
  await page.getByRole("button", { name: /Continuar/ }).click()
  await expect(page.getByText("¿Qué días sueles entregar cajas?")).toBeVisible()
  await expect(page.getByRole("button", { name: "Lunes" })).toHaveAttribute("aria-pressed", "true")
})

test("el perfil del cliente muestra ahorro e impacto", async ({ page }) => {
  await login(page, "cliente@rescat.ec", "/reservations")
  await expect(page.getByText("Cajas rescatadas")).toBeVisible()
  await expect(page.getByText("Dinero ahorrado")).toBeVisible()
  await expect(page.getByText("Impacto evitado")).toBeVisible()
})
