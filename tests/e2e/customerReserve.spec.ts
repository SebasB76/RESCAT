import { expect, test } from "@playwright/test"

async function login(page: import("@playwright/test").Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill("rescat123")
  await page.getByRole("button", { name: "Entrar con correo" }).click()
  await page.waitForURL((url) => url.pathname === next)
}

test("una reserva anónima muestra acceso contextual sin perder la caja", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Cajas con comida buena. A precio de rescate." })).toBeVisible()
  const firstBox = page.locator("#cajas a[href^='/?box=']").first()
  await expect(firstBox).toBeVisible()
  await expect(firstBox.locator("img")).toHaveAttribute("src", /cajas%2Fcaja-(desayuno|despensa)\.webp/)
  await firstBox.click()
  await expect(page.getByRole("dialog", { name: "Detalle de caja" })).toBeVisible()
  await page.getByRole("button", { name: /Confirmar reserva/ }).click()
  await expect(page.getByRole("heading", { name: "Entra para reservar esta caja" })).toBeVisible()
  await expect(page.getByText("La caja seguirá esperándote aquí.")).toBeVisible()
  const boxDialog = page.getByRole("dialog", { name: "Detalle de caja" })
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

test("un producto anónimo queda en el carrito mientras se solicita acceso", async ({ page }) => {
  await page.goto("/")
  const addButton = page.locator("#catalogo").getByRole("button", { name: /Agregar/ }).first()
  await addButton.scrollIntoViewIfNeeded()
  await addButton.click()
  await expect(page.getByRole("dialog", { name: "Tu producto ya está en el carrito" })).toBeVisible()
  await expect(page.getByText("Tu selección se mantiene mientras entras.")).toBeVisible()
  await expect(page.getByRole("button", { name: "Cerrar" })).toBeFocused()
  await page.keyboard.press("Escape")
  await expect(page.getByRole("dialog", { name: "Tu producto ya está en el carrito" })).toBeHidden()
  await expect(page.getByLabel("Abrir carrito")).toContainText("1")
})

test("el catálogo real muestra la promoción por volumen", async ({ page }) => {
  await page.goto("/")
  const product = page.locator("#catalogo article").filter({ hasText: "Atún D'Gussto 140g" })
  await expect(product).toContainText("$1.00")
  await expect(product).toContainText("3 por $2.50")
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
