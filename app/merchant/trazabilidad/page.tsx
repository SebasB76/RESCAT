import { createServerClient } from "@/lib/supabase/server"
import { resolveStoreScope } from "@/lib/storeScope"
import { TraceabilityTable, type TraceabilityRow } from "@/components/traceabilityTable"

export default async function MerchantTraceability({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams
  const { storeId } = resolveStoreScope(store)
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const [{ data: lots }, { data: stores }] = await Promise.all([
    supabase.rpc("lots_with_level", { p_store: storeId }),
    supabase.from("store").select("id, name").eq("ownerId", user?.id ?? ""),
  ])

  const storeNames: Record<string, string> = Object.fromEntries((stores ?? []).map((s) => [s.id, s.name] as const))

  const rows: TraceabilityRow[] = (lots ?? []).map((l) => ({
    id: l.id,
    storeId: l.storeId,
    storeName: storeNames[l.storeId] ?? "—",
    productName: l.productName,
    brand: l.brand,
    category: l.category,
    subcategory: l.subcategory,
    receivedAt: l.receivedAt,
    expiryDate: l.expiryDate,
    daysToExpiry: l.daysToExpiry,
    qty: l.qty,
    unitCost: l.unitCost,
    price: l.price,
    totalValue: l.totalValue,
    level: l.level,
    autoDiscountPct: l.autoDiscountPct,
    rescatPrice: l.rescatPrice,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-pino">Trazabilidad de inventario</h1>
        <p className="mt-1 text-sm text-pino/60">Todos los lotes en percha, ordenados por urgencia de caducidad.</p>
      </div>
      <TraceabilityTable rows={rows} />
    </div>
  )
}
