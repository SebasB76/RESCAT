import { notFound } from "next/navigation"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { UrgencyChip } from "@/components/urgencyChip"
import { Button } from "@/components/ui/button"

export default async function BoxDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: box } = await supabase.from("box").select("*, store(id,name,address,neighborhood)").eq("id", id).single()
  if (!box) notFound()
  const store = box.store as { id: string; name: string; address: string; neighborhood: string | null }
  const { data: reviews } = await supabase.from("review").select("rating,comment").eq("storeId", store.id).order("createdAt", { ascending: false }).limit(10)
  const avg = reviews?.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "—"
  const off = Math.round((1 - box.price / box.originalPrice) * 100)
  const soldOut = box.status !== "active" || box.stockQty < 1

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <div className="overflow-hidden rounded-2xl bg-white">
        {box.photoUrl && <img src={box.photoUrl} alt={box.title} className="h-64 w-full object-cover" />}
        <div className="space-y-3 p-5">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-2xl text-pino">{box.title}</h1>
            <span className="rounded-full bg-terracota px-2 py-0.5 text-sm font-bold text-white">-{off}%</span>
          </div>
          <p className="text-hoja">{store.name} · {store.neighborhood} · {store.address}</p>
          <UrgencyChip bestBefore={box.bestBefore} />
          {box.description && <p>{box.description}</p>}
          {!!box.items?.length && <ul className="list-disc pl-5 text-sm text-pino/80">{box.items.map((it, i) => <li key={i}>{it}</li>)}</ul>}
          <div className="flex items-center justify-between pt-2">
            <span><span className="text-pino/50 line-through">${box.originalPrice}</span> <span className="font-display text-2xl text-pino">${box.price}</span></span>
            {soldOut ? <span className="font-semibold text-terracota">Agotado</span>
              : <Link href={`/reserve/${box.id}`}><Button className="bg-pino">Reservar</Button></Link>}
          </div>
        </div>
      </div>
      <section className="mt-6">
        <h2 className="font-display text-lg text-pino">Reseñas · ★ {avg}</h2>
        <div className="mt-3 space-y-3">
          {reviews?.map((r, i) => (
            <div key={i} className="rounded-xl border border-pino/10 bg-white p-3">
              <div className="text-dorado">{"★".repeat(r.rating)}</div>
              {r.comment && <p className="text-sm text-pino/80">{r.comment}</p>}
            </div>
          ))}
          {!reviews?.length && <p className="text-sm text-hoja">Aún sin reseñas.</p>}
        </div>
      </section>
    </main>
  )
}
