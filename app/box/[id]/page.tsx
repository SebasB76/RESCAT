import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { BoxReserve, type ReserveBox } from "@/components/boxReserve"
import { money } from "@/lib/format"
import { BrandMark } from "@/components/brandMark"

export default async function BoxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: box } = await supabase.from("box").select("*, store(id,name,neighborhood,address,pickupInfo)").eq("id", id).single()
  if (!box) notFound()
  const store = box.store as { id: string; name: string; neighborhood: string | null; address: string; pickupInfo: string | null }

  const [{ data: reviews }, { data: contents }, { data: { user } }] = await Promise.all([
    supabase.from("review").select("rating,comment,createdAt").eq("boxId", id).order("createdAt", { ascending: false }).limit(10),
    supabase.from("box_item").select("qty, product(name, brand, price)").eq("boxId", id),
    supabase.auth.getUser(),
  ])
  const avg = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—"
  const rating = reviews?.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  const items = ((contents ?? [])
    .map((c) => {
      const p = c.product as unknown as { name: string; brand: string | null; price: number } | null
      return p ? { name: p.name, brand: p.brand, price: Number(p.price), qty: c.qty } : null
    })
    .filter(Boolean)) as { name: string; brand: string | null; price: number; qty: number }[]
  const realValue = items.reduce((s, i) => s + i.price * i.qty, 0)

  const detail: ReserveBox = {
    id: box.id,
    title: box.title,
    description: box.description,
    category: box.category,
    items: box.items ?? [],
    price: box.price,
    originalPrice: box.originalPrice,
    photoUrl: box.photoUrl,
    bestBefore: box.bestBefore,
    pickupStart: box.pickupStart,
    pickupEnd: box.pickupEnd,
    tipo: box.tipo,
    storeName: store.name,
    neighborhood: store.neighborhood,
    address: store.address,
    pickupInfo: store.pickupInfo,
    rating,
    reviewCount: reviews?.length ?? 0,
    stockQty: box.stockQty,
    status: box.status,
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-8 flex items-center justify-between gap-4">
        <BrandMark />
        <Link href="/" className="text-sm font-semibold text-hoja hover:text-pino">Volver a la tienda</Link>
      </div>
      <BoxReserve box={detail} signedIn={Boolean(user)} />

      {items.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-pino">Contenido verificado</h2>
          <p className="text-sm text-pino/72">Productos del catálogo de {store.name} que rescatas en esta caja.</p>
          <div className="mt-3 divide-y divide-pino/10 overflow-hidden rounded-xl bg-white ring-1 ring-pino/12">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-pino">{it.qty > 1 ? `${it.qty}× ` : ""}{it.name}{it.brand ? ` · ${it.brand}` : ""}</span>
                <span className="tabular-nums text-pino/72">{money(it.price * it.qty)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between bg-cream/50 px-4 py-2.5 text-sm font-semibold">
              <span className="text-pino">Valor real</span>
              <span className="tabular-nums text-pino">{money(realValue)}</span>
            </div>
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="text-lg font-bold text-pino">Reseñas de esta caja · ★ {avg}</h2>
        <div className="mt-3 space-y-3">
          {reviews?.map((r, i) => (
            <div key={i} className="rounded-lg bg-white p-4 ring-1 ring-pino/12">
              <div className="text-dorado">{"★".repeat(r.rating)}</div>
              {r.comment && <p className="mt-1 text-sm text-pino/80">{r.comment}</p>}
            </div>
          ))}
          {!reviews?.length && <p className="text-sm text-hoja">Aún sin reseñas.</p>}
        </div>
      </section>
    </main>
  )
}
