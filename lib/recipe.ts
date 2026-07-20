export type RecipeIngredient = {
  name: string
  amount: string
  source: "box" | "pantry"
}

export type GeneratedRecipe = {
  title: string
  description: string
  servings: number
  totalMinutes: number
  ingredients: RecipeIngredient[]
  steps: string[]
  storageTips: string[]
  safetyNote: string
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

export function parseGeneratedRecipe(value: unknown): GeneratedRecipe | null {
  if (!value || typeof value !== "object") return null
  const recipe = value as Record<string, unknown>
  const ingredients = recipe.ingredients
  if (
    typeof recipe.title !== "string"
    || typeof recipe.description !== "string"
    || !Number.isInteger(recipe.servings)
    || !Number.isInteger(recipe.totalMinutes)
    || !Array.isArray(ingredients)
    || !ingredients.every((item) => {
      if (!item || typeof item !== "object") return false
      const ingredient = item as Record<string, unknown>
      return typeof ingredient.name === "string"
        && typeof ingredient.amount === "string"
        && (ingredient.source === "box" || ingredient.source === "pantry")
    })
    || !isStringArray(recipe.steps)
    || !isStringArray(recipe.storageTips)
    || typeof recipe.safetyNote !== "string"
  ) return null

  return recipe as GeneratedRecipe
}
