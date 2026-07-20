import "server-only"
import { createHash } from "node:crypto"
import { parseGeneratedRecipe, type GeneratedRecipe } from "@/lib/recipe"

type RecipeInput = {
  userId: string
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

function outputText(payload: unknown) {
  if (!payload || typeof payload !== "object") return null
  const response = payload as { output_text?: unknown; output?: unknown }
  if (typeof response.output_text === "string") return response.output_text
  if (!Array.isArray(response.output)) return null
  for (const item of response.output) {
    if (!item || typeof item !== "object") continue
    const content = (item as { content?: unknown }).content
    if (!Array.isArray(content)) continue
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text
      }
    }
  }
  return null
}

export async function createRecipeWithOpenAI(input: RecipeInput): Promise<{ recipe: GeneratedRecipe; model: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error("ai_not_configured")

  const model = process.env.OPENAI_RECIPE_MODEL || "gpt-5.6-luna"
  const ingredients = input.items.map((item) => ({
    name: item.name,
    brand: item.brand,
    category: item.category,
    quantity: item.qty,
  }))

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      store: false,
      safety_identifier: createHash("sha256").update(input.userId).digest("hex"),
      reasoning: { effort: "low" },
      max_output_tokens: 1800,
      input: [
        {
          role: "system",
          content: [
            "Eres un cocinero práctico de Ecuador especializado en reducir desperdicio alimentario.",
            "Crea una sola receta sencilla en español usando los productos de la caja como ingredientes principales.",
            "No inventes que la caja contiene otros productos. Puedes añadir básicos domésticos como agua, sal, aceite o especias, marcándolos como pantry.",
            "Respeta las cantidades aproximadas, evita afirmaciones médicas y nunca garantices que un alimento es seguro.",
            "La nota de seguridad debe pedir revisar alérgenos, olor, textura, empaque y fecha antes de cocinar.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            box: input.boxTitle,
            requestedServings: input.servings,
            rescuedIngredients: ingredients,
          }),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "rescat_recipe",
          strict: true,
          schema: recipeSchema,
        },
      },
    }),
    signal: AbortSignal.timeout(25_000),
  })

  if (!response.ok) throw new Error(response.status === 429 ? "ai_busy" : "ai_unavailable")
  const payload: unknown = await response.json()
  const text = outputText(payload)
  if (!text) throw new Error("ai_invalid_response")

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("ai_invalid_response")
  }
  const recipe = parseGeneratedRecipe(parsed)
  if (!recipe) throw new Error("ai_invalid_response")
  return { recipe, model }
}
