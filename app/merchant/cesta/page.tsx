import { createServerClient } from "@/lib/supabase/server"
import { resolveStoreScope } from "@/lib/storeScope"
import { BasketRules, type BasketRule } from "@/components/basketRules"

export default async function MerchantCesta({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>
}) {
  const { store } = await searchParams
  const { storeId } = resolveStoreScope(store)

  const supabase = await createServerClient()
  const query = supabase.from("basket_rule").select("*").order("lift", { ascending: false })
  const { data } = storeId ? await query.eq("storeId", storeId) : await query.is("storeId", null)
  const rules: BasketRule[] = data ?? []

  return (
    <div>
      <div>
        <h1 className="font-display text-2xl text-pino">Análisis de Cesta (MBA)</h1>
        <p className="mt-1 text-sm text-hoja">
          Reglas de asociación de compra · {rules.length} {rules.length === 1 ? "regla" : "reglas"}
          {storeId ? " · tienda seleccionada" : " · ambas tiendas"}
        </p>
      </div>
      <BasketRules rules={rules} />
    </div>
  )
}
