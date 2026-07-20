import { expect, test, type Page } from "@playwright/test"
import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

// These tests write isolated records to Supabase and remove them in finally blocks.

config({ path: ".env.local", quiet: true })

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

async function login(page: Page, email: string, next: string) {
  await page.goto(`/login?next=${encodeURIComponent(next)}`)
  await page.locator('input[type="email"]').fill(email)
  await page.locator('input[type="password"]').fill("rescat123")
  await page.getByRole("button", { name: "Entrar con correo" }).click()
  const target = new URL(next, "http://localhost:3000")
  await page.waitForURL((url) => url.pathname === target.pathname && url.search === target.search)
}

test.describe.configure({ mode: "serial" })

test("reserva → aviso a tienda → retiro → reseña visible en la caja", async ({ browser }) => {
  test.setTimeout(90_000)
  const startedAt = new Date().toISOString()
  let reservationId: string | null = null
  let boxId: string | null = null

  const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1_000 })
  const merchant = users.users.find((user) => user.email === "tienda@rescat.ec")
  const customer = users.users.find((user) => user.email === "cliente@rescat.ec")
  expect(merchant).toBeTruthy()
  expect(customer).toBeTruthy()

  const { data: stores } = await admin.from("store").select("id,name").eq("ownerId", merchant!.id)
  expect(stores?.[0]).toBeTruthy()
  const now = Date.now()
  const { data: box, error: boxError } = await admin
    .from("box")
    .insert({
      storeId: stores![0].id,
      title: `Caja smoke ${now}`,
      description: "Caja temporal del recorrido transaccional.",
      category: "Despensa",
      tipo: "duo",
      items: ["Arroz", "Atún", "Tomate"],
      originalPrice: 10,
      price: 4,
      stockQty: 3,
      pickupStart: new Date(now - 60_000).toISOString(),
      pickupEnd: new Date(now + 4 * 60 * 60_000).toISOString(),
      status: "active",
    })
    .select("id,title,storeId,stockQty,status")
    .single()
  expect(boxError).toBeNull()
  expect(box).toBeTruthy()
  boxId = box!.id

  const { data: profile } = await admin.from("profile").select("fullName,phone").eq("id", customer!.id).single()
  const reviewComment = `Smoke RESCAT ${Date.now()}: caja recibida correctamente.`
  const merchantContext = await browser.newContext()
  const customerContext = await browser.newContext()
  const merchantPage = await merchantContext.newPage()
  const customerPage = await customerContext.newPage()

  try {
    await login(merchantPage, "tienda@rescat.ec", "/merchant/reservations")
    await expect(merchantPage.getByRole("heading", { name: "Reservas" })).toBeVisible()

    await login(customerPage, "cliente@rescat.ec", `/?box=${box!.id}`)
    const detailDialog = customerPage.getByRole("dialog", { name: "Detalle de caja" })
    await expect(detailDialog).toBeVisible()
    await expect(detailDialog.getByRole("heading", { name: box!.title })).toBeVisible()
    await customerPage.getByRole("button", { name: /Confirmar reserva/ }).click()
    await expect(customerPage.getByText("Reserva confirmada")).toBeVisible()
    await expect(customerPage.getByRole("button", { name: "Generar receta con IA" })).toBeVisible()
    const code = (await customerPage.getByText(/^RC-[A-F0-9]{6}$/).textContent())!

    const { data: reservation } = await admin
      .from("reservation")
      .select("id")
      .eq("code", code)
      .gte("reservedAt", startedAt)
      .single()
    reservationId = reservation!.id

    await expect(merchantPage.getByText(`Nueva reserva · ${code}`)).toBeVisible({ timeout: 15_000 })
    const merchantCode = merchantPage.getByText(code, { exact: true })
    await expect(merchantCode).toBeVisible({ timeout: 15_000 })
    const merchantRow = merchantCode.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' p-4 ')][1]")
    await expect(merchantRow).toContainText(box!.title)
    await expect(merchantRow).toContainText(profile?.fullName ?? "Rescatista")
    await expect(merchantRow).toContainText(profile?.phone ?? "sin teléfono")
    await merchantRow.getByRole("button", { name: "Marcar retirado" }).click()
    await expect.poll(async () => {
      const { data } = await admin.from("reservation").select("status").eq("id", reservationId!).single()
      return data?.status
    }, { timeout: 15_000 }).toBe("pickedUp")
    await expect(merchantRow.getByText("Retirado", { exact: true }).first()).toBeVisible({ timeout: 15_000 })

    await customerPage.goto("/reservations")
    const customerCode = customerPage.getByText(code, { exact: true })
    await expect(customerCode).toBeVisible()
    const customerRow = customerCode.locator("xpath=ancestor::div[contains(concat(' ', normalize-space(@class), ' '), ' rounded-xl ')][1]")
    await expect(customerRow.getByPlaceholder("¿Cómo estuvo tu caja?")).toBeVisible()
    await customerRow.getByRole("button", { name: "Calificar con 4 estrellas" }).click()
    await customerRow.getByPlaceholder("¿Cómo estuvo tu caja?").fill(reviewComment)
    await customerRow.getByRole("button", { name: "Enviar reseña" }).click()
    await expect(customerRow.getByText("Reseña enviada ✓")).toBeVisible()

    const { data: review } = await admin
      .from("review")
      .select("id,rating,comment,boxId")
      .eq("reservationId", reservationId)
      .single()
    expect(review).toMatchObject({ rating: 4, comment: reviewComment, boxId: box!.id })

    await customerPage.goto(`/box/${box!.id}`)
    await expect(customerPage.getByText(reviewComment)).toBeVisible()
  } finally {
    if (!reservationId && boxId) {
      const { data: recent } = await admin
        .from("reservation")
        .select("id")
        .eq("boxId", boxId)
        .eq("customerId", customer!.id)
        .gte("reservedAt", startedAt)
        .order("reservedAt", { ascending: false })
        .limit(1)
      reservationId = recent?.[0]?.id ?? null
    }
    if (reservationId) await admin.from("reservation").delete().eq("id", reservationId)
    if (boxId) await admin.from("box").delete().eq("id", boxId)
    await merchantContext.close()
    await customerContext.close()
  }
})

test("una tienda nueva completa el registro y entra al asistente de su primera caja", async ({ page }) => {
  test.setTimeout(90_000)
  const suffix = Date.now()
  const email = `smoke-tienda-${suffix}@example.com`
  const storeName = `Tienda Smoke ${suffix}`
  let userId: string | null = null

  try {
    const { data: pendingAccount, error: accountError } = await admin.auth.admin.createUser({
      email,
      password: "rescat123",
      email_confirm: false,
      user_metadata: { full_name: "Encargada Smoke" },
    })
    expect(accountError).toBeNull()
    userId = pendingAccount.user!.id

    await page.goto("/signup")
    await page.getByRole("button", { name: "Soy tienda" }).click()
    await page.getByLabel("Nombre del encargado").fill("Encargada Smoke")
    await page.getByLabel("Correo").fill(email)
    await page.getByLabel("Contraseña").fill("rescat123")
    await page.getByLabel("Teléfono").fill("0995550101")
    await page.getByRole("button", { name: /Continuar/ }).click()

    await page.getByLabel("Nombre de la tienda").fill(storeName)
    await page.getByLabel("Dirección").fill("Urdesa Central, Guayaquil")
    await page.getByLabel("Barrio o sector").fill("Urdesa")
    await page.getByRole("button", { name: /Continuar/ }).click()

    await page.getByLabel("Instrucciones habituales de retiro").fill("Mostrar el código de RESCAT en caja.")
    await page.getByRole("button", { name: /Continuar/ }).click()
    await expect(page.getByText("Revisa antes de activar")).toBeVisible()
    const activateButton = page.getByRole("button", { name: "Activar tienda" })
    await expect(activateButton).toHaveAttribute("type", "submit")
    expect(await activateButton.evaluate((button) => (button as HTMLButtonElement).form?.checkValidity())).toBe(true)
    await activateButton.click()
    await expect.poll(() => page.evaluate(() => Boolean(window.localStorage.getItem("rescat_merchant_draft")))).toBe(true)

    await expect(page.getByRole("heading", { name: "Confirma tu correo" })).toBeVisible()
    await admin.auth.admin.updateUserById(userId, { email_confirm: true })
    await page.getByRole("button", { name: "Ya confirmé mi correo" }).click()

    await page.waitForURL((url) => url.pathname === "/merchant/boxes/new", { timeout: 30_000 })
    await expect(page.getByRole("heading", { name: "Presenta tu caja" })).toBeVisible()

    const { data: store } = await admin.from("store").select("name,address,pickupInfo").eq("ownerId", userId).single()
    expect(store?.name).toBe(storeName)
    expect(store?.address).toBe("Urdesa Central, Guayaquil")
    expect(store?.pickupInfo).toContain("Días habituales de retiro")
    expect(store?.pickupInfo).toContain("Mostrar el código de RESCAT en caja.")
  } finally {
    if (!userId) {
      const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1_000 })
      userId = users.users.find((user) => user.email === email)?.id ?? null
    }
    if (userId) await admin.auth.admin.deleteUser(userId)
  }
})
