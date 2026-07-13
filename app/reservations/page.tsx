import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ReviewForm } from "@/components/reviewForm"
import { money, statusLabel } from "@/lib/format"
import { BrandMark } from "@/components/brandMark"
import { CircleDollarSignIcon, LeafIcon, PackageCheckIcon } from "lucide-react"
import { co2KgSaved, foodKgSaved, type BoxTipo } from "@/lib/impact"

export default async function MyOrders({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/reservations")

  const [{ data: reservations }, { data: purchases }, { data: profile }] = await Promise.all([
    supabase.from("reservation").select("id,code,status,amount,reservedAt,box(title,storeId,originalPrice,tipo),review(id)").eq("customerId", user.id).order("reservedAt", { ascending: false }),
    supabase.from("purchase").select("id,code,status,total,createdAt,store(name),purchase_item(qty)").eq("customerId", user.id).order("createdAt", { ascending: false }),
    supabase.from("profile").select("fullName").eq("id", user.id).single(),
  ])

  const resRows = (reservations ?? []).map((r) => {
    const box = r.box as unknown as { title: string; storeId: string; originalPrice: number; tipo: BoxTipo }
    const hasReview = Array.isArray(r.review) ? r.review.length > 0 : !!r.review
    return { id: r.id, kind: "Caja", title: box.title, code: r.code, status: r.status, amount: Number(r.amount), originalPrice: Number(box.originalPrice), tipo: box.tipo, date: r.reservedAt, storeId: box.storeId, reviewable: r.status === "pickedUp" && !hasReview }
  })
  const purRows = (purchases ?? []).map((p) => {
    const store = p.store as unknown as { name: string } | null
    const items = (p.purchase_item as unknown as { qty: number }[] | null) ?? []
    const count = items.reduce((s, i) => s + i.qty, 0)
    return { id: p.id, kind: "Compra", title: `${count} ${count === 1 ? "producto" : "productos"} · ${store?.name ?? ""}`, code: p.code, status: p.status, amount: Number(p.total), originalPrice: Number(p.total), tipo: null as BoxTipo | null, date: p.createdAt, storeId: null as string | null, reviewable: false }
  })
  const rows = [...resRows, ...purRows].sort((a, b) => (a.date < b.date ? 1 : -1))
  const completedBoxes = resRows.filter((row) => row.status === "pickedUp")
  const savedMoney = completedBoxes.reduce((sum, row) => sum + Math.max(0, row.originalPrice - row.amount), 0)
  const savedFood = completedBoxes.reduce((sum, row) => sum + foodKgSaved(row.tipo), 0)
  const avoidedCo2 = completedBoxes.reduce((sum, row) => sum + co2KgSaved(row.tipo), 0)

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <BrandMark />
      <div className="mt-10 flex items-end justify-between border-b border-pino/15 pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-[-0.035em] text-pino">{profile?.fullName ? `Hola, ${profile.fullName.split(" ")[0]}` : "Mis rescates"}</h1>
          <p className="mt-1 text-sm text-pino/72">Tus cajas, códigos de retiro e impacto acumulado.</p>
        </div>
        <Link href="/" className="text-sm font-semibold text-hoja hover:text-pino">Seguir comprando</Link>
      </div>
      {code && (
        <p className="mt-3 rounded-lg bg-hoja/10 p-3 text-sm text-pino">
          Pedido confirmado. Muestra el código <b className="font-mono">{code}</b> en la tienda.
        </p>
      )}
      <dl className="mt-6 grid overflow-hidden rounded-xl bg-pino text-white sm:grid-cols-3">
        <div className="p-4 sm:p-5">
          <dt className="flex items-center gap-2 text-sm font-semibold text-dorado"><PackageCheckIcon className="size-4" /> Cajas rescatadas</dt>
          <dd className="mt-2 text-2xl font-black tabular-nums">{completedBoxes.length}</dd>
        </div>
        <div className="border-t border-white/12 p-4 sm:border-l sm:border-t-0 sm:p-5">
          <dt className="flex items-center gap-2 text-sm font-semibold text-dorado"><CircleDollarSignIcon className="size-4" /> Dinero ahorrado</dt>
          <dd className="mt-2 text-2xl font-black tabular-nums">{money(savedMoney)}</dd>
        </div>
        <div className="border-t border-white/12 p-4 sm:border-l sm:border-t-0 sm:p-5">
          <dt className="flex items-center gap-2 text-sm font-semibold text-dorado"><LeafIcon className="size-4" /> Impacto evitado</dt>
          <dd className="mt-2 text-2xl font-black tabular-nums">{avoidedCo2.toFixed(1)} kg CO₂</dd>
          <p className="mt-1 text-xs text-white/70">~{savedFood.toFixed(1)} kg de alimentos</p>
        </div>
      </dl>
      <div className="mt-6 space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl bg-white p-4 ring-1 ring-pino/12">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-md bg-pino/[0.06] px-2 py-1 text-xs font-semibold text-pino/60">{r.kind}</span>
                <p className="mt-1 font-medium text-pino">{r.title}</p>
                <p className="mt-1 text-xs text-pino/60">{new Intl.DateTimeFormat("es-EC", { dateStyle: "medium", timeStyle: "short" }).format(new Date(r.date))}</p>
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
