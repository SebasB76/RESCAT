import { createServerClient } from "@/lib/supabase/server"
import { resolveStoreScope } from "@/lib/storeScope"
import { OfferCard, type Offer } from "@/components/offerCard"

const activeLevels = ["CRITICO", "ALERTA", "ADVERTENCIA"]

function money(n: number) {
  return `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function MerchantOfertas({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const { store } = await searchParams
  const { storeId } = resolveStoreScope(store)
  const supabase = await createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: stores } = await supabase.from("store").select("id, name").eq("ownerId", user!.id)
  const storeNames = new Map((stores ?? []).map((s) => [s.id, s.name] as const))

  const { data: lots } = await supabase.rpc("lots_with_level", { p_store: storeId })
  const offers: Offer[] = (lots ?? [])
    .filter((l) => activeLevels.includes(l.level) && l.autoDiscountPct > 0)
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
    .map((l) => ({
      id: l.id,
      productName: l.productName,
      brand: l.brand,
      category: l.category,
      storeName: storeNames.get(l.storeId) ?? "Tienda",
      qty: l.qty,
      daysToExpiry: l.daysToExpiry,
      totalValue: l.totalValue,
      price: l.price,
      rescatPrice: l.rescatPrice,
      autoDiscountPct: l.autoDiscountPct,
      level: l.level,
    }))

  const totalAtRisk = offers.reduce((acc, o) => acc + o.totalValue, 0)

  return (
    <div>
      <div className="rounded-2xl border border-dorado/30 bg-dorado/10 p-4">
        <h1 className="font-display text-3xl text-pino">Ofertas Especiales</h1>
        <p className="mt-1 text-sm text-hoja">Solo bajada de precio · Productos por vencer que no van en caja sorpresa</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white px-3 py-1 font-medium text-pino">{offers.length} ofertas activas</span>
          <span className="rounded-full bg-white px-3 py-1 font-medium text-terracota">Valor en riesgo · {money(totalAtRisk)}</span>
        </div>
      </div>

      {!offers.length ? (
        <p className="mt-6 text-hoja">No hay productos en oferta especial actualmente.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {offers.map((o) => <OfferCard key={o.id} offer={o} />)}
        </div>
      )}
    </div>
  )
}
