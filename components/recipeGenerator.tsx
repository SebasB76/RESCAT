"use client"

import { useState } from "react"
import { ChefHatIcon, Clock3Icon, Loader2Icon, SparklesIcon, UsersIcon } from "lucide-react"
import { generateReservationRecipe } from "@/actions/recipes"
import type { GeneratedRecipe } from "@/lib/recipe"
import { Button } from "@/components/ui/button"

function errorMessage(code: string) {
  if (code === "ai_not_configured") return "Falta configurar la clave de IA. La reserva está segura; podrás generar la receta después."
  if (code === "recipe_has_no_items") return "Esta caja no tiene contenido registrado para preparar una receta."
  if (code === "ai_busy") return "La cocina de IA está ocupada. Inténtalo nuevamente en un momento."
  if (code === "not_authenticated") return "Tu sesión terminó. Vuelve a entrar para generar la receta."
  return "No pudimos preparar la receta ahora. Tu reserva no se vio afectada."
}

export function RecipeGenerator({ reservationId, initialRecipe = null }: {
  reservationId: string
  initialRecipe?: GeneratedRecipe | null
}) {
  const [recipe, setRecipe] = useState(initialRecipe)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const result = await generateReservationRecipe(reservationId)
      if (!result.ok) {
        setError(errorMessage(result.error))
        return
      }
      setRecipe(result.recipe)
    } catch {
      setError(errorMessage("ai_unavailable"))
    } finally {
      setLoading(false)
    }
  }

  if (!recipe) {
    return (
      <section aria-label="Receta con tu caja" className="border-t border-pino/10 pt-4">
        <div className="flex items-start gap-3 text-left">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-dorado/35 text-pino">
            <ChefHatIcon className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-bold text-pino">Cocina lo que rescataste</h3>
            <p className="mt-1 text-sm leading-5 text-pino/70">La IA combinará el contenido registrado de tu caja en una receta práctica.</p>
          </div>
        </div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-terracota/10 px-3 py-2 text-sm leading-5 text-terracota">{error}</p>}
        <Button type="button" onClick={generate} disabled={loading} className="mt-4 min-h-11 w-full bg-dorado text-pino hover:bg-pino hover:text-white">
          {loading ? <><Loader2Icon className="size-4 animate-spin" /> Preparando receta…</> : <><SparklesIcon className="size-4" /> Generar receta con IA</>}
        </Button>
      </section>
    )
  }

  const boxIngredients = recipe.ingredients.filter((ingredient) => ingredient.source === "box")
  const pantryIngredients = recipe.ingredients.filter((ingredient) => ingredient.source === "pantry")

  return (
    <section aria-label={`Receta: ${recipe.title}`} className="border-t border-pino/10 pt-4 text-left">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-hoja/12 text-hoja">
          <ChefHatIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-xs font-semibold text-hoja"><SparklesIcon className="size-3.5" /> Receta creada para tu caja</p>
          <h3 className="mt-1 text-lg font-bold leading-tight text-pino">{recipe.title}</h3>
          <p className="mt-1 text-sm leading-5 text-pino/72">{recipe.description}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-pino/72">
        <span className="inline-flex items-center gap-1.5"><UsersIcon className="size-4 text-hoja" /> {recipe.servings} {recipe.servings === 1 ? "porción" : "porciones"}</span>
        <span className="inline-flex items-center gap-1.5"><Clock3Icon className="size-4 text-hoja" /> {recipe.totalMinutes} minutos</span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <div>
          <h4 className="text-sm font-bold text-pino">De tu caja</h4>
          <ul className="mt-2 space-y-1.5">
            {boxIngredients.map((ingredient, index) => <li key={`${ingredient.name}-${index}`} className="text-sm leading-5 text-pino/75"><span className="font-semibold text-pino">{ingredient.amount}</span> · {ingredient.name}</li>)}
          </ul>
        </div>
        {pantryIngredients.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-pino">Necesitarás además</h4>
            <ul className="mt-2 space-y-1.5">
              {pantryIngredients.map((ingredient, index) => <li key={`${ingredient.name}-${index}`} className="text-sm leading-5 text-pino/75"><span className="font-semibold text-pino">{ingredient.amount}</span> · {ingredient.name}</li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-5">
        <h4 className="text-sm font-bold text-pino">Preparación</h4>
        <ol className="mt-2 space-y-3">
          {recipe.steps.map((step, index) => (
            <li key={index} className="flex gap-3 text-sm leading-6 text-pino/80">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-pino text-xs font-bold text-white">{index + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {recipe.storageTips.length > 0 && (
        <div className="mt-5">
          <h4 className="text-sm font-bold text-pino">Para aprovechar mejor</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-5 text-pino/75">
            {recipe.storageTips.map((tip, index) => <li key={index}>{tip}</li>)}
          </ul>
        </div>
      )}

      <p className="mt-5 rounded-lg bg-dorado/20 px-3 py-2 text-xs leading-5 text-pino/75">{recipe.safetyNote}</p>
    </section>
  )
}
