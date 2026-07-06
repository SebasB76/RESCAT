import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { resolveStoreScope } from "@/lib/storeScope"
import { DashboardKpis, type DashboardKpi } from "@/components/dashboardKpis"
import { DashboardChart } from "@/components/dashboardChart"
import { DashboardAlerts } from "@/components/dashboardAlerts"
import { DashboardCombos } from "@/components/dashboardCombos"

const money = (n: number) => `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const count = (n: number) => Number(n).toLocaleString("es-EC")

export default async function MerchantDashboard({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams
  const { storeId } = resolveStoreScope(store)
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()

  const salesQuery = supabase.from("sales_kpi").select("ventasTotal, nPedidos")
  const salesReq = storeId ? salesQuery.eq("storeId", storeId) : salesQuery.is("storeId", null)
  const comboQuery = supabase.from("basket_rule").select("id, a, b, freq, confAB, lift")
  const comboScoped = storeId ? comboQuery.eq("storeId", storeId) : comboQuery.is("storeId", null)
  const comboReq = comboScoped.order("lift", { ascending: false }).limit(5)

  const [{ data: stores }, { data: kpiRows }, { data: lots }, { data: salesRows }, { data: combos }] = await Promise.all([
    supabase.from("store").select("id, name").eq("ownerId", user?.id ?? ""),
    supabase.rpc("inventory_kpis", { p_store: storeId }),
    supabase.rpc("lots_with_level", { p_store: storeId }),
    salesReq,
    comboReq,
  ])

  const storeName = new Map((stores ?? []).map((s): [string, string] => [s.id, s.name]))
  const ventasTotal = (salesRows ?? []).reduce((sum, r) => sum + Number(r.ventasTotal ?? 0), 0)
  const nPedidos = (salesRows ?? []).reduce((sum, r) => sum + Number(r.nPedidos ?? 0), 0)

  const k = kpiRows?.[0]
  const kpis: DashboardKpi[] = [
    { label: "Valor inventario", value: money(k?.valorTotal ?? 0), sub: `${count(k?.nLotes ?? 0)} lotes · ${count(k?.ok ?? 0)} OK`, accent: "bg-hoja" },
    { label: "Críticos ≤7d", value: count(k?.criticos ?? 0), sub: `${money(k?.valorRiesgo7d ?? 0)} en riesgo`, accent: "bg-terracota", urgent: true },
    { label: "En alerta 8–14d", value: count(k?.enAlerta ?? 0), sub: `${count(k?.advertencia ?? 0)} en advertencia`, accent: "bg-dorado" },
    { label: "Ventas totales", value: money(ventasTotal), sub: `${count(nPedidos)} pedidos`, accent: "bg-pino" },
    { label: "Riesgo 30d", value: money(k?.valorRiesgo30d ?? 0), sub: `${count(k?.qtyRiesgo30d ?? 0)} uds en riesgo`, accent: "bg-dorado" },
  ]

  const catValues = new Map<string, number>()
  for (const lot of lots ?? []) {
    const cat = lot.category ?? "Sin categoría"
    catValues.set(cat, (catValues.get(cat) ?? 0) + Number(lot.totalValue ?? 0))
  }
  const categories = [...catValues.entries()]
    .map(([category, value]) => ({ category, value, label: money(value) }))
    .sort((a, b) => b.value - a.value)
  const maxCategory = categories[0]?.value ?? 0

  const alerts = (lots ?? [])
    .filter((l) => l.level === "CRITICO")
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      productName: l.productName,
      brand: l.brand,
      tienda: storeName.get(l.storeId) ?? "—",
      days: l.daysToExpiry,
      qty: l.qty,
      rescatPrice: money(l.rescatPrice),
    }))

  const comboRows = (combos ?? []).map((c) => ({ id: c.id, a: c.a, b: c.b, freq: c.freq, confAB: c.confAB, lift: c.lift }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl text-pino">Dashboard</h1>
        <p className="mt-1 text-sm text-hoja">Resumen del inventario y las ventas.</p>
      </div>

      <DashboardKpis items={kpis} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-pino/10 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-pino">Alertas urgentes</h2>
              <p className="text-xs text-pino/50">Lotes críticos que caducan pronto.</p>
            </div>
            <Link href="/merchant/trazabilidad" className="shrink-0 text-xs font-medium text-hoja hover:text-pino">Ver todos →</Link>
          </div>
          <div className="mt-4">
            <DashboardAlerts rows={alerts} />
          </div>
        </section>

        <section className="rounded-xl border border-pino/10 bg-white p-4">
          <div>
            <h2 className="font-display text-lg text-pino">Stock por categoría</h2>
            <p className="text-xs text-pino/50">Valor en percha por categoría.</p>
          </div>
          <div className="mt-4">
            <DashboardChart data={categories} max={maxCategory} />
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-pino/10 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-pino">Top combos de compra</h2>
            <p className="text-xs text-pino/50">Análisis de cesta · lift = fuerza de la asociación.</p>
          </div>
          <Link href="/merchant/cesta" className="shrink-0 text-xs font-medium text-hoja hover:text-pino">Ver análisis →</Link>
        </div>
        <div className="mt-4">
          <DashboardCombos rows={comboRows} />
        </div>
      </section>
    </div>
  )
}
