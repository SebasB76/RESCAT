import { createServerClient } from "@/lib/supabase/server"
import { resolveStoreScope } from "@/lib/storeScope"

const money = (n: number) => `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default async function MerchantDashboard({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams
  const { storeId } = resolveStoreScope(store)
  const supabase = await createServerClient()
  const { data } = await supabase.rpc("inventory_kpis", { p_store: storeId })
  const k = data?.[0]

  const cards = k ? [
    { label: "Valor inventario", value: money(k.valorTotal) },
    { label: "Lotes críticos ≤7d", value: k.criticos, urgent: true },
    { label: "En alerta 8–14d", value: k.enAlerta },
    { label: "Valor en riesgo 30d", value: money(k.valorRiesgo30d) },
  ] : []

  return (
    <div>
      <h1 className="font-display text-2xl text-pino">Dashboard</h1>
      <p className="mt-1 text-sm text-hoja">Resumen general del inventario.</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-pino/10 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-pino/40">{c.label}</p>
            <p className={`mt-1 font-display text-2xl ${c.urgent ? "text-terracota" : "text-pino"}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
