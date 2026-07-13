import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { resolveStoreScope } from "@/lib/storeScope"
import { DashboardKpis, type DashboardKpi } from "@/components/dashboardKpis"
import { DashboardChart } from "@/components/dashboardChart"
import { DashboardAlerts } from "@/components/dashboardAlerts"
import { DashboardCombos } from "@/components/dashboardCombos"
import { ArrowRightIcon, PlusIcon } from "lucide-react"

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

  const storeNames = new Map((stores ?? []).map((s): [string, string] => [s.id, s.name]))
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
      storeName: storeNames.get(l.storeId) ?? "—",
      days: l.daysToExpiry,
      qty: l.qty,
      rescatPrice: money(l.rescatPrice),
    }))

  const comboRows = (combos ?? []).map((c) => ({ id: c.id, a: c.a, b: c.b, freq: c.freq, confAB: c.confAB, lift: c.lift }))
  const today = new Intl.DateTimeFormat("es-EC", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Guayaquil" }).format(new Date())
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 border-b border-pino/12 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-hoja">{todayLabel}</p>
          <h1 className="text-3xl font-bold tracking-[-0.035em] text-pino">Hoy en tu tienda</h1>
          <p className="mt-2 text-sm text-pino/72">Inventario, rescates y decisiones pendientes en una sola vista.</p>
        </div>
        <Link href="/merchant/boxes/new" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-pino px-4 text-sm font-bold text-white transition-colors hover:bg-hoja">
          <PlusIcon className="size-4" /> Publicar caja
        </Link>
      </div>

      <DashboardKpis items={kpis} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(19rem,0.65fr)]">
        <section className="rounded-xl bg-white ring-1 ring-pino/12">
          <div className="flex items-start justify-between gap-3">
            <div className="p-5 pb-3">
              <h2 className="text-lg font-bold text-pino">Atención inmediata</h2>
              <p className="mt-1 text-sm text-pino/72">Lotes que caducan en siete días o menos.</p>
            </div>
            <Link href="/merchant/trazabilidad" className="m-5 inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-hoja hover:text-pino">Inventario <ArrowRightIcon className="size-4" /></Link>
          </div>
          <div className="overflow-hidden border-t border-pino/10">
            <DashboardAlerts rows={alerts} />
          </div>
        </section>

        <section className="rounded-xl bg-white p-5 ring-1 ring-pino/12">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-pino">Valor en percha</h2>
              <p className="mt-1 text-sm text-pino/72">Distribución por categoría.</p>
            </div>
          </div>
          <div className="mt-6">
            <DashboardChart data={categories} max={maxCategory} />
          </div>
        </section>
      </div>

      <section className="rounded-xl bg-white ring-1 ring-pino/12">
        <div className="flex items-start justify-between gap-3">
          <div className="p-5 pb-3">
            <h2 className="text-lg font-bold text-pino">Productos que salen juntos</h2>
            <p className="mt-1 text-sm text-pino/72">Oportunidades de combinación basadas en pedidos reales.</p>
          </div>
          <Link href="/merchant/cesta" className="m-5 inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-hoja hover:text-pino">Ver análisis <ArrowRightIcon className="size-4" /></Link>
        </div>
        <div className="overflow-hidden border-t border-pino/10">
          <DashboardCombos rows={comboRows} />
        </div>
      </section>
    </div>
  )
}
