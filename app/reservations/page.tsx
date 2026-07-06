import { createServerClient } from "@/lib/supabase/server"
import { ReviewForm } from "@/components/reviewForm"

export default async function MyReservations({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: rows } = await supabase
    .from("reservation")
    .select("id,code,status,amount,box(title,storeId),review(id)")
    .eq("customerId", user!.id)
    .order("reservedAt", { ascending: false })

  return (
    <main className="mx-auto max-w-2xl px-6 py-8">
      <h1 className="font-display text-2xl text-pino">Mis reservas</h1>
      {code && <p className="mt-2 rounded-lg bg-hoja/10 p-3 text-pino">Reserva confirmada. Muestra el código <b className="font-mono">{code}</b> en la tienda.</p>}
      <div className="mt-6 space-y-3">
        {rows?.map((r) => {
          const box = r.box as { title: string; storeId: string }
          const hasReview = Array.isArray(r.review) ? r.review.length > 0 : !!r.review
          return (
            <div key={r.id} className="rounded-xl border border-pino/10 bg-white p-4">
              <div className="flex justify-between">
                <span className="font-medium">{box.title}</span>
                <span className="font-mono text-sm">{r.code}</span>
              </div>
              <p className="text-sm text-hoja">${r.amount} · {r.status}</p>
              {r.status === "pickedUp" && !hasReview && <ReviewForm reservationId={r.id} storeId={box.storeId} />}
            </div>
          )
        })}
        {!rows?.length && <p className="text-hoja">Aún no tienes reservas.</p>}
      </div>
    </main>
  )
}
