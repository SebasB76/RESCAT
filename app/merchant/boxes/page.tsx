import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"

export default async function MerchantBoxes() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user!.id)
  const storeIds = (stores ?? []).map((s) => s.id)
  const { data: boxes } = await supabase.from("box").select("*")
    .in("storeId", storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"])
    .order("createdAt", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-pino">Mis cajas</h1>
        <Link href="/merchant/boxes/new" className="rounded-lg bg-hoja px-3 py-1.5 text-sm text-cream">+ Nueva caja</Link>
      </div>
      {!boxes?.length && <p className="mt-4 text-hoja">Aún no tienes cajas. Crea la primera.</p>}
      <div className="mt-6 grid gap-3">
        {boxes?.map((b) => (
          <Link key={b.id} href={`/merchant/boxes/${b.id}`} className="rounded-xl border border-pino/10 bg-white p-4">
            <div className="flex justify-between">
              <span className="font-medium">{b.title}</span>
              <span className="text-sm text-hoja">${b.price} · stock {b.stockQty} · {b.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
