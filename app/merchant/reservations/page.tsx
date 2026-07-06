import { createServerClient } from "@/lib/supabase/server"
import { confirmPickup } from "@/actions/reservations"
import { Button } from "@/components/ui/button"
import { money, statusLabel } from "@/lib/format"

export default async function MerchantReservations() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user!.id)
  const storeIds = (stores ?? []).map((s) => s.id)
  const { data: rows } = await supabase
    .from("reservation")
    .select("id,code,status,amount,paymentMethod,box!inner(title,storeId)")
    .in("box.storeId", storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"])
    .order("reservedAt", { ascending: false })

  async function confirm(formData: FormData) {
    "use server"
    await confirmPickup(String(formData.get("id")))
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-pino">Reservas</h1>
      <div className="mt-6 grid gap-3">
        {rows?.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-xl border border-pino/10 bg-white p-4">
            <div>
              <div className="font-mono font-medium">{r.code}</div>
              <div className="text-sm text-hoja">
                {(r.box as { title: string }).title} · {money(r.amount)} · {r.paymentMethod === "cashOnPickup" ? "efectivo" : "tarjeta"} · {statusLabel(r.status)}
              </div>
            </div>
            {r.status !== "pickedUp" && (
              <form action={confirm}>
                <input type="hidden" name="id" value={r.id} />
                <Button className="bg-hoja">Marcar retirado</Button>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
