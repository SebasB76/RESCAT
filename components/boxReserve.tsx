"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { BanknoteIcon, CheckIcon, CreditCardIcon, XIcon } from "lucide-react"
import { reserveBox } from "@/actions/reservations"
import { processPayment, type PaymentMethod } from "@/lib/payment"
import { UrgencyChip } from "@/components/urgencyChip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { money } from "@/lib/format"

export type ReserveBox = {
  id: string
  title: string
  description: string | null
  items: string[]
  price: number
  originalPrice: number
  photoUrl: string | null
  bestBefore: string | null
  storeName: string
  neighborhood: string | null
  stockQty: number
  status: string
}

export function BoxReserve({ box, onClose }: { box: ReserveBox; onClose?: () => void }) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>("cashOnPickup")
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const off = box.originalPrice > 0 ? Math.round((1 - box.price / box.originalPrice) * 100) : 0
  const soldOut = box.status !== "active" || box.stockQty < 1

  async function confirm() {
    setBusy(true)
    try {
      const pay = await processPayment(method, box.price)
      if (!pay.ok) {
        toast.error("El pago no se pudo procesar")
        setBusy(false)
        return
      }
      const reservation = await reserveBox(box.id, method)
      setCode(reservation.code)
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "not_authenticated") {
        router.push(`/login?next=${encodeURIComponent(`/?box=${box.id}`)}`)
        return
      }
      toast.error(msg === "out_of_stock" ? "Se agotó justo ahora" : "No se pudo reservar")
      setBusy(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
      <div className="relative h-48 bg-cream">
        {box.photoUrl && <img src={box.photoUrl} alt={box.title} className="h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-t from-pino/80 to-transparent" />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-white/90 text-pino transition hover:bg-white"
          >
            <XIcon className="size-4" />
          </button>
        )}
        {off > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-terracota px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>
        )}
        <h2 className="absolute right-4 bottom-3 left-4 font-display text-2xl text-white drop-shadow">{box.title}</h2>
      </div>

      {code ? (
        <div className="p-6 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-hoja/15 text-hoja">
            <CheckIcon className="size-7" />
          </div>
          <p className="mt-3 font-display text-xl text-pino">¡Reserva confirmada!</p>
          <p className="mt-1 text-sm text-hoja">Muestra este código en {box.storeName} al retirar.</p>
          <p className="mt-4 rounded-xl border border-dashed border-pino/25 bg-cream py-3 font-mono text-2xl font-bold tracking-widest text-pino">{code}</p>
          <div className="mt-5 flex gap-2">
            <Button onClick={() => router.push("/reservations")} variant="outline" className="flex-1 border-pino/20">Mis pedidos</Button>
            <Button onClick={onClose ?? (() => router.push("/"))} className="flex-1 bg-pino">Listo</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-hoja">{box.storeName}{box.neighborhood ? ` · ${box.neighborhood}` : ""}</span>
            <UrgencyChip bestBefore={box.bestBefore} />
          </div>
          {box.description && <p className="text-sm text-pino/80">{box.description}</p>}
          {box.items?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold tracking-wide text-pino/50 uppercase">Qué incluye</p>
              <ul className="space-y-1">
                {box.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg bg-cream px-3 py-1.5 text-sm text-pino">
                    <span className="text-hoja">•</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between rounded-xl border border-hoja/20 bg-hoja/5 px-4 py-3">
            <div>
              <p className="text-xs text-pino/50">Precio rescate</p>
              <p className="font-display text-2xl text-pino tabular-nums">{money(box.price)}</p>
            </div>
            <p className="text-sm text-pino/40 line-through tabular-nums">{money(box.originalPrice)}</p>
          </div>

          {soldOut ? (
            <p className="rounded-lg bg-terracota/10 py-3 text-center text-sm font-semibold text-terracota">Agotado por ahora</p>
          ) : (
            <>
              <div>
                <p className="mb-1.5 text-xs font-semibold tracking-wide text-pino/50 uppercase">Forma de pago</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMethod("cashOnPickup")}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm transition ${method === "cashOnPickup" ? "border-hoja bg-hoja/10 text-pino" : "border-pino/15 text-pino/60 hover:border-pino/30"}`}
                  >
                    <BanknoteIcon className="size-5" />Efectivo
                    <span className="text-[0.68rem] text-pino/40">Al retirar</span>
                  </button>
                  <button
                    onClick={() => setMethod("cardMock")}
                    className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-sm transition ${method === "cardMock" ? "border-hoja bg-hoja/10 text-pino" : "border-pino/15 text-pino/60 hover:border-pino/30"}`}
                  >
                    <CreditCardIcon className="size-5" />Tarjeta
                    <span className="text-[0.68rem] text-pino/40">Débito o crédito</span>
                  </button>
                </div>
              </div>
              {method === "cardMock" && (
                <div className="space-y-2 rounded-xl border border-pino/10 bg-cream/50 p-3">
                  <Input placeholder="Número de tarjeta" inputMode="numeric" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="MM/AA" />
                    <Input placeholder="CVV" inputMode="numeric" />
                  </div>
                </div>
              )}
              <Button onClick={confirm} disabled={busy} className="w-full bg-pino py-6 text-base">
                {busy ? "Procesando…" : `Confirmar reserva · ${money(box.price)}`}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
