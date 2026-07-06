import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { BoxReserve, type ReserveBox } from "@/components/boxReserve"

export default async function BoxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: box } = await supabase.from("box").select("*, store(id,name,neighborhood)").eq("id", id).single()
  if (!box) notFound()
  const store = box.store as { id: string; name: string; neighborhood: string | null }
  const { data: reviews } = await supabase.from("review").select("rating,comment").eq("storeId", store.id).order("createdAt", { ascending: false }).limit(10)
  const avg = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—"

  const detail: ReserveBox = {
    id: box.id,
    title: box.title,
    description: box.description,
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
    stockQty: box.stockQty,
    status: box.status,
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-10">
      <Link href="/" className="mb-4 inline-flex items-center gap-1 text-sm text-pino hover:text-hoja">← Volver a la tienda</Link>
      <BoxReserve box={detail} />
      <section className="mt-6">
        <h2 className="font-display text-lg text-pino">Reseñas · ★ {avg}</h2>
        <div className="mt-3 space-y-3">
          {reviews?.map((r, i) => (
            <div key={i} className="rounded-xl border border-pino/10 bg-white p-3">
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
