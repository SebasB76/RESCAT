import { createServerClient } from "@/lib/supabase/server"
import { resolveStoreScope } from "@/lib/storeScope"
import { CategoryBars, type CategoryBar } from "@/components/categoryBars"
import { SalesTrendChart } from "@/components/salesTrendChart"

const money = (n: number) => `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const count = (n: number) => Number(n).toLocaleString("es-EC")

export default async function MerchantVentas({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams
  const { storeId } = resolveStoreScope(store)
  const supabase = await createServerClient()

  const kpiQuery = supabase.from("sales_kpi").select("*")
  const { data: kpiRows } = storeId ? await kpiQuery.eq("storeId", storeId) : await kpiQuery.is("storeId", null)
  const kpi = kpiRows?.[0]

  const catBase = supabase.from("category_sales").select("*")
  const catFiltered = storeId ? catBase.eq("storeId", storeId) : catBase.is("storeId", null)
  const { data: categoryRows } = await catFiltered.order("sales", { ascending: false })
  const categories = categoryRows ?? []

  const trendBase = supabase.from("monthly_sales").select("*")
  const trendFiltered = storeId ? trendBase.eq("storeId", storeId) : trendBase.is("storeId", null)
  const { data: monthlyRows } = await trendFiltered.order("month", { ascending: true })
  const monthly = monthlyRows ?? []

  let scopeLabel = "Ambas tiendas"
  if (storeId) {
    const { data: s } = await supabase.from("store").select("name").eq("id", storeId).maybeSingle()
    if (s?.name) scopeLabel = s.name
  }

  const maxSales = Math.max(...categories.map((c) => c.sales), 1)
  const margins = categories.map((c) => (c.sales > 0 ? (c.profit / c.sales) * 100 : 0))
  const maxMargin = Math.max(...margins, 1)

  const salesBars: CategoryBar[] = categories.map((c) => ({
    label: c.category,
    ratio: c.sales / maxSales,
    inside: `$${(c.sales / 1000).toFixed(1)}K`,
    right: money(c.sales),
  }))
  const marginBars: CategoryBar[] = categories.map((c, i) => ({
    label: c.category,
    ratio: margins[i] / maxMargin,
    inside: `${margins[i].toFixed(1)}%`,
    right: `${margins[i].toFixed(1)}%`,
  }))

  const kpiCards = kpi
    ? [
        { label: "Ventas totales", value: money(kpi.ventasTotal) },
        { label: "Ganancia total", value: money(kpi.gananciaTotal) },
        { label: "Pedidos", value: count(kpi.nPedidos) },
        { label: "Clientes", value: count(kpi.nClientes) },
      ]
    : []

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl text-pino">Ventas & Márgenes</h1>
        <span className="text-sm text-hoja">{scopeLabel}</span>
      </div>
      <p className="mt-1 text-sm text-pino/60">Historial de ventas y márgenes por tienda.</p>

      {!kpi ? (
        <p className="mt-6 text-hoja">Aún no hay datos de ventas.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {kpiCards.map((c) => (
            <div key={c.label} className="rounded-xl border border-pino/10 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-pino/40">{c.label}</p>
              <p className="mt-1 font-display text-2xl text-pino">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-pino/10 bg-white p-4">
          <h2 className="font-display text-lg text-pino">Ventas netas por categoría</h2>
          <div className="mt-4">
            <CategoryBars bars={salesBars} tone="hoja" />
          </div>
        </div>
        <div className="rounded-xl border border-pino/10 bg-white p-4">
          <h2 className="font-display text-lg text-pino">Margen % por categoría</h2>
          <div className="mt-4">
            <CategoryBars bars={marginBars} tone="dorado" />
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-pino/10 bg-white p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg text-pino">Tendencia mensual</h2>
          <span className="text-xs text-pino/50">Ventas y ganancia por mes</span>
        </div>
        <div className="mt-4">
          <SalesTrendChart points={monthly.map((m) => ({ month: m.month, sales: m.sales, profit: m.profit }))} />
        </div>
      </div>
    </div>
  )
}
