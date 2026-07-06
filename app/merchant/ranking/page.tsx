import { createServerClient } from "@/lib/supabase/server"
import { resolveStoreScope } from "@/lib/storeScope"

const money = (n: number) => `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const count = (n: number) => Number(n).toLocaleString("es-EC")
const rankBadge: Record<number, string> = {
  1: "bg-dorado text-pino",
  2: "bg-pino/15 text-pino",
  3: "bg-terracota/20 text-terracota",
}

export default async function MerchantRanking({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams
  const { storeId } = resolveStoreScope(store)
  const supabase = await createServerClient()

  const base = supabase.from("top_product").select("*")
  const filtered = storeId ? base.eq("storeId", storeId) : base.is("storeId", null)
  const { data: productRows } = await filtered.order("rank", { ascending: true }).limit(20)
  const products = productRows ?? []

  let scopeLabel = "Ambas tiendas"
  if (storeId) {
    const { data: s } = await supabase.from("store").select("name").eq("id", storeId).maybeSingle()
    if (s?.name) scopeLabel = s.name
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl text-pino">Top 20 Productos</h1>
        <span className="text-sm text-hoja">{scopeLabel}</span>
      </div>
      <p className="mt-1 text-sm text-pino/60">Ranking acumulado por ganancia.</p>

      {!products.length ? (
        <p className="mt-6 text-hoja">Aún no hay productos rankeados.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-pino/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-pino/10 text-left text-xs uppercase tracking-wide text-pino/40">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium">Marca</th>
                  <th className="px-4 py-3 text-right font-medium">Ganancia</th>
                  <th className="px-4 py-3 text-right font-medium">Ventas</th>
                  <th className="px-4 py-3 text-right font-medium">Unidades</th>
                  <th className="px-4 py-3 text-right font-medium">Margen %</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const top3 = p.rank <= 3
                  const margin = p.sales > 0 ? (p.profit / p.sales) * 100 : 0
                  return (
                    <tr key={p.id} className={`border-b border-pino/5 transition-colors last:border-0 hover:bg-cream/50 ${top3 ? "bg-dorado/5" : ""}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex size-7 items-center justify-center rounded-full text-xs font-bold tabular-nums ${rankBadge[p.rank] ?? "text-pino/40"}`}>
                          {p.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-pino">{p.name}</td>
                      <td className="px-4 py-3 text-xs uppercase tracking-wide text-pino/50">{p.brand ?? "—"}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-hoja">{money(p.profit)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-pino/80">{money(p.sales)}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-pino/80">{count(p.qty)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-block rounded-full bg-cream px-2 py-0.5 text-xs font-medium tabular-nums text-pino">{margin.toFixed(1)}%</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
