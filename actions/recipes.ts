"use server"

import { revalidatePath } from "next/cache"
import { createServerClient } from "@/lib/supabase/server"
import { createRecipeWithGemini } from "@/lib/geminiRecipe"
import { parseGeneratedRecipe, type GeneratedRecipe } from "@/lib/recipe"
import type { Json } from "@/lib/database.types"

export type RecipeActionError =
  | "invalid_reservation"
  | "not_authenticated"
  | "reservation_not_found"
  | "recipe_has_no_items"
  | "ai_not_configured"
  | "ai_busy"
  | "ai_unavailable"

export type RecipeActionResult =
  | { ok: true; recipe: GeneratedRecipe; cached: boolean }
  | { ok: false; error: RecipeActionError }

function knownRecipeError(error: unknown): RecipeActionError {
  const code = error instanceof Error ? error.message : ""
  if (
    code === "ai_not_configured"
    || code === "ai_busy"
    || code === "recipe_has_no_items"
    || code === "not_authenticated"
    || code === "invalid_reservation"
    || code === "reservation_not_found"
  ) return code
  return "ai_unavailable"
}

function recipeFromRow(row: {
  title: string
  description: string
  servings: number
  totalMinutes: number
  ingredients: Json
  steps: Json
  storageTips: string[]
  safetyNote: string
}) {
  return parseGeneratedRecipe({
    title: row.title,
    description: row.description,
    servings: row.servings,
    totalMinutes: row.totalMinutes,
    ingredients: row.ingredients,
    steps: row.steps,
    storageTips: row.storageTips,
    safetyNote: row.safetyNote,
  })
}

export async function generateReservationRecipe(reservationId: string): Promise<RecipeActionResult> {
  if (!reservationId) return { ok: false, error: "invalid_reservation" }
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: "not_authenticated" }

  const { data: cached } = await supabase
    .from("reservation_recipe")
    .select("title,description,servings,totalMinutes,ingredients,steps,storageTips,safetyNote")
    .eq("reservationId", reservationId)
    .eq("customerId", user.id)
    .maybeSingle()
  if (cached) {
    const recipe = recipeFromRow(cached)
    if (recipe) return { ok: true, recipe, cached: true }
  }

  const [{ data: reservation }, { data: items }] = await Promise.all([
    supabase
      .from("reservation")
      .select("id,customerId,box(title,tipo)")
      .eq("id", reservationId)
      .eq("customerId", user.id)
      .single(),
    supabase
      .from("reservation_item")
      .select("name,brand,category,qty")
      .eq("reservationId", reservationId)
      .order("createdAt"),
  ])

  if (!reservation) return { ok: false, error: "reservation_not_found" }
  if (!items?.length) return { ok: false, error: "recipe_has_no_items" }
  const box = reservation.box as unknown as { title: string; tipo: "solo" | "duo" | "familia" } | null
  if (!box) return { ok: false, error: "reservation_not_found" }
  const servings = box.tipo === "solo" ? 1 : box.tipo === "duo" ? 2 : 4

  let generated: Awaited<ReturnType<typeof createRecipeWithGemini>>
  try {
    generated = await createRecipeWithGemini({
      boxTitle: box.title,
      servings,
      items,
    })
  } catch (error) {
    return { ok: false, error: knownRecipeError(error) }
  }

  const { error } = await supabase.from("reservation_recipe").upsert({
    reservationId,
    customerId: user.id,
    title: generated.recipe.title,
    description: generated.recipe.description,
    servings: generated.recipe.servings,
    totalMinutes: generated.recipe.totalMinutes,
    ingredients: generated.recipe.ingredients as unknown as Json,
    steps: generated.recipe.steps as unknown as Json,
    storageTips: generated.recipe.storageTips,
    safetyNote: generated.recipe.safetyNote,
    model: generated.model,
    updatedAt: new Date().toISOString(),
  }, { onConflict: "reservationId" })
  if (error) return { ok: false, error: "ai_unavailable" }

  revalidatePath("/reservations")
  return { ok: true, recipe: generated.recipe, cached: false }
}
