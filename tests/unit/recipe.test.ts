import { describe, expect, it } from "vitest"
import { parseGeneratedRecipe, parseGeneratedRecipeText } from "@/lib/recipe"

const recipe = {
  title: "Tortilla de rescate",
  description: "Una preparación rápida.",
  servings: 2,
  totalMinutes: 20,
  ingredients: [
    { name: "Papa", amount: "2 unidades", source: "box" },
    { name: "Sal", amount: "al gusto", source: "pantry" },
  ],
  steps: ["Lava los ingredientes.", "Cocina hasta que estén listos."],
  storageTips: ["Refrigera las sobras."],
  safetyNote: "Revisa alérgenos, olor, textura, empaque y fecha antes de cocinar.",
}

describe("parseGeneratedRecipe", () => {
  it("accepts the structured recipe contract", () => {
    expect(parseGeneratedRecipe(recipe)).toEqual(recipe)
  })

  it("rejects ingredients with an unknown source", () => {
    expect(parseGeneratedRecipe({
      ...recipe,
      ingredients: [{ name: "Papa", amount: "2", source: "invented" }],
    })).toBeNull()
  })

  it("accepts Gemini JSON wrapped in a Markdown code fence", () => {
    expect(parseGeneratedRecipeText(`\`\`\`json\n${JSON.stringify(recipe)}\n\`\`\``)).toEqual(recipe)
  })
})
