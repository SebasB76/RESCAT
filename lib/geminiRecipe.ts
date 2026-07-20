import "server-only"
import { GoogleGenAI } from "@google/genai"
import { parseGeneratedRecipe, type GeneratedRecipe } from "@/lib/recipe"

type RecipeInput = {
  boxTitle: string
  servings: number
  items: { name: string; brand: string | null; category: string | null; qty: number }[]
}

const recipeSchema = {
  type: "object",
  additionalProperties: false,
  required: ["title", "description", "servings", "totalMinutes", "ingredients", "steps", "storageTips", "safetyNote"],
  properties: {
    title: { type: "string", minLength: 1, maxLength: 90 },
    description: { type: "string", minLength: 1, maxLength: 240 },
    servings: { type: "integer", minimum: 1, maximum: 12 },
    totalMinutes: { type: "integer", minimum: 1, maximum: 1440 },
    ingredients: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "amount", "source"],
        properties: {
          name: { type: "string", minLength: 1, maxLength: 100 },
          amount: { type: "string", minLength: 1, maxLength: 60 },
          source: { type: "string", enum: ["box", "pantry"] },
        },
      },
    },
    steps: {
      type: "array",
      minItems: 2,
      maxItems: 12,
      items: { type: "string", minLength: 1, maxLength: 400 },
    },
    storageTips: {
      type: "array",
      maxItems: 5,
      items: { type: "string", minLength: 1, maxLength: 240 },
    },
    safetyNote: { type: "string", minLength: 1, maxLength: 300 },
  },
} as const

function rateLimited(error: unknown) {
  if (!error || typeof error !== "object") return false
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown }
  return candidate.status === 429
    || candidate.code === 429
    || (typeof candidate.message === "string" && candidate.message.includes("429"))
}

export async function createRecipeWithGemini(input: RecipeInput): Promise<{ recipe: GeneratedRecipe; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("ai_not_configured")

  const model = process.env.GEMINI_RECIPE_MODEL || "gemini-3.5-flash"
  const ingredients = input.items.map((item) => ({
    name: item.name,
    brand: item.brand,
    category: item.category,
    quantity: item.qty,
  }))

  const ai = new GoogleGenAI({ apiKey })
  let outputText: string | undefined

  try {
    const interaction = await ai.interactions.create({
      model,
      store: false,
      system_instruction: [
        "Eres un cocinero práctico de Ecuador especializado en reducir desperdicio alimentario.",
        "Crea una sola receta sencilla en español usando los productos de la caja como ingredientes principales.",
        "No inventes que la caja contiene otros productos. Puedes añadir básicos domésticos como agua, sal, aceite o especias, marcándolos como pantry.",
        "Respeta las cantidades aproximadas, evita afirmaciones médicas y nunca garantices que un alimento es seguro.",
        "La nota de seguridad debe pedir revisar alérgenos, olor, textura, empaque y fecha antes de cocinar.",
      ].join(" "),
      input: JSON.stringify({
        box: input.boxTitle,
        requestedServings: input.servings,
        rescuedIngredients: ingredients,
      }),
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: recipeSchema,
      },
      generation_config: {
        max_output_tokens: 1800,
        temperature: 0.35,
      },
    }, { timeout: 25_000, maxRetries: 1 })
    outputText = interaction.output_text
  } catch (error) {
    throw new Error(rateLimited(error) ? "ai_busy" : "ai_unavailable")
  }

  if (!outputText) throw new Error("ai_invalid_response")

  let parsed: unknown
  try {
    parsed = JSON.parse(outputText)
  } catch {
    throw new Error("ai_invalid_response")
  }

  const recipe = parseGeneratedRecipe(parsed)
  if (!recipe) throw new Error("ai_invalid_response")
  return { recipe, model }
}
