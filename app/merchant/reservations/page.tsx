import { ClipboardListIcon, TicketIcon, BanknoteIcon, CreditCardIcon, CheckCircle2Icon, UserRoundIcon, PhoneIcon } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { confirmPickup } from "@/actions/reservations"
import { Button } from "@/components/ui/button"
import { money, statusLabel } from "@/lib/format"

const statusTone: Record<string, string> = {
  reserved: "bg-dorado/15 text-dorado",
  paid: "bg-hoja/15 text-hoja",
  pickedUp: "bg-pino/10 text-pino",
  expired: "bg-pino/8 text-pino/50",
  cancelled: "bg-terracota/15 text-terracota",
}

type Reservation = {
  id: string; code: string; status: string; amount: number; commissionAmount: number; total: number
  paymentMethod: string; boxTitle: string
  customerName: string | null; customerPhone: string | null
}

function Row({ r, confirm }: { r: Reservation; confirm: (fd: FormData) => void }) {
  const actionable = r.status === "reserved" || r.status === "paid"
  const cash = r.paymentMethod === "cashOnPickup"
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-cream text-hoja">
          <TicketIcon className="size-5" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-semibold tracking-wide text-pino">{r.code}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${statusTone[r.status] ?? "bg-pino/10 text-pino/60"}`}>
              {statusLabel(r.status)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-sm text-pino/70">{r.boxTitle}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-pino/60">
            <span className="inline-flex items-center gap-1"><UserRoundIcon className="size-3.5" />{r.customerName ?? "Rescatista"}</span>
            <span className="inline-flex items-center gap-1"><PhoneIcon className="size-3.5" />{r.customerPhone ?? "sin teléfono"}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-display text-lg tabular-nums text-pino">{money(r.total)}</div>
          <div className="text-xs tabular-nums text-pino/50">Caja {money(r.amount)} · comisión {money(r.commissionAmount)}</div>
          <div className="flex items-center justify-end gap-1 text-xs text-pino/50">
            {cash ? <BanknoteIcon className="size-3.5" /> : <CreditCardIcon className="size-3.5" />}
            {cash ? "Efectivo" : "Tarjeta"}
          </div>
        </div>
        {actionable ? (
          <form action={confirm}>
            <input type="hidden" name="id" value={r.id} />
            <Button type="submit" className="h-9 bg-hoja px-3 text-cream hover:bg-hoja/90">Marcar retirado</Button>
          </form>
        ) : r.status === "pickedUp" ? (
          <span className="flex items-center gap-1 text-sm font-medium text-hoja">
            <CheckCircle2Icon className="size-4" />
            Retirado
          </span>
        ) : null}
      </div>
    </div>
  )
}

export default async function MerchantReservations() {
  const supabase = await createServerClient()
  const { data: rows } = await supabase.rpc("store_reservations")

  async function confirm(formData: FormData) {
    "use server"
    await confirmPickup(String(formData.get("id")))
  }

  const all: Reservation[] = (rows ?? []).map((r) => ({
    id: r.id, code: r.code, status: r.status, amount: Number(r.amount),
    commissionAmount: Number(r.commissionAmount), total: Number(r.total),
    paymentMethod: r.paymentMethod, boxTitle: r.boxTitle,
    customerName: r.customerName, customerPhone: r.customerPhone,
  }))
  const pending = all.filter((r) => r.status === "reserved" || r.status === "paid")
  const history = all.filter((r) => r.status !== "reserved" && r.status !== "paid")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-pino">Reservas</h1>
        <p className="mt-1 text-sm text-pino/60">Confirma los retiros con el código que muestra cada Rescatista. Verás quién reservó y su contacto.</p>
      </div>

      {!all.length ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-pino/20 bg-white px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-cream text-hoja">
            <ClipboardListIcon className="size-7" />
          </span>
          <h2 className="mt-4 font-display text-xl text-pino">Todavía no hay reservas</h2>
          <p className="mt-1 max-w-sm text-sm text-pino/60">Cuando un Rescatista reserve una de tus cajas, aparecerá aquí para que confirmes el retiro.</p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pino/50">
              Por retirar
              <span className="inline-flex items-center rounded-full bg-dorado/15 px-2 py-0.5 text-xs font-semibold tabular-nums text-dorado">{pending.length}</span>
            </h2>
            {pending.length ? (
              <div className="divide-y divide-pino/5 overflow-hidden rounded-xl border border-pino/10 bg-white">
                {pending.map((r) => <Row key={r.id} r={r} confirm={confirm} />)}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-pino/15 bg-white px-4 py-6 text-center text-sm text-pino/50">No hay reservas pendientes de retiro.</p>
            )}
          </section>

          {history.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pino/50">
                Historial
                <span className="inline-flex items-center rounded-full bg-pino/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-pino/60">{history.length}</span>
              </h2>
              <div className="divide-y divide-pino/5 overflow-hidden rounded-xl border border-pino/10 bg-white">
                {history.map((r) => <Row key={r.id} r={r} confirm={confirm} />)}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
