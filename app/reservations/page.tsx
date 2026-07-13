import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ReviewForm } from "@/components/reviewForm"
import { money, statusLabel } from "@/lib/format"

export default async function MyOrders({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/reservations")

  const [{ data: reservations }, { data: purchases }] = await Promise.all([
    supabase.from("reservation").select("id,code,status,amount,reservedAt,box(title,storeId),review(id)").eq("customerId", user.id).order("reservedAt", { ascending: false }),
    supabase.from("purchase").select("id,code,status,total,createdAt,store(name),purchase_item(qty)").eq("customerId", user.id).order("createdAt", { ascending: false }),
  ])

  const resRows = (reservations ?? []).map((r) => {
    const box = r.box as unknown as { title: string; storeId: string }
    const hasReview = Array.isArray(r.review) ? r.review.length > 0 : !!r.review
    return { id: r.id, kind: "Caja", title: box.title, code: r.code, status: r.status, amount: Number(r.amount), date: r.reservedAt, storeId: box.storeId, reviewable: r.status === "pickedUp" && !hasReview }
  })
  const purRows = (purchases ?? []).map((p) => {
    const store = p.store as unknown as { name: string } | null
    const items = (p.purchase_item as unknown as { qty: number }[] | null) ?? []
    const count = items.reduce((s, i) => s + i.qty, 0)
    return { id: p.id, kind: "Compra", title: `${count} ${count === 1 ? "producto" : "productos"} · ${store?.name ?? ""}`, code: p.code, status: p.status, amount: Number(p.total), date: p.createdAt, storeId: null as string | null, reviewable: false }
  })
  const rows = [...resRows, ...purRows].sort((a, b) => (a.date < b.date ? 1 : -1))

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-pino">Mis pedidos</h1>
        <Link href="/" className="text-sm text-pino hover:text-hoja">← Tienda</Link>
      </div>
      {code && (
        <p className="mt-3 rounded-lg bg-hoja/10 p-3 text-sm text-pino">
          Pedido confirmado. Muestra el código <b className="font-mono">{code}</b> en la tienda.
        </p>
      )}
      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-pino/10 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-full bg-cream px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-pino/60 uppercase">{r.kind}</span>
                <p className="mt-1 font-medium text-pino">{r.title}</p>
              </div>
              <span className="shrink-0 font-mono text-sm text-pino">{r.code}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="tabular-nums text-hoja">{money(r.amount)}</span>
              <span className="rounded-full bg-pino/5 px-2 py-0.5 text-xs font-medium text-pino/70">{statusLabel(r.status)}</span>
            </div>
            {r.reviewable && <ReviewForm reservationId={r.id} />}
          </div>
        ))}
        {!rows.length && (
          <p className="text-hoja">Aún no tienes pedidos. <Link href="/" className="text-pino underline">Explora la tienda</Link>.</p>
        )}
      </div>
    </main>
  )
}
