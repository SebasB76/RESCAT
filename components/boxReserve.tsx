"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { BanknoteIcon, CheckIcon, CreditCardIcon, ShoppingBasketIcon, XIcon } from "lucide-react"
import { reserveBox } from "@/actions/reservations"
import { processPayment, type PaymentMethod } from "@/lib/payment"
import { UrgencyChip } from "@/components/urgencyChip"
import { RescueBadge } from "@/components/rescueBadge"
import { ScarcityBadge } from "@/components/scarcityBadge"
import { PickupWindow } from "@/components/pickupWindow"
import { ProvenanceChip } from "@/components/provenanceChip"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { money } from "@/lib/format"
import { foodKgSaved, co2KgSaved, type BoxTipo } from "@/lib/impact"

export type ReserveBox = {
  id: string
  title: string
  description: string | null
  items: string[]
  price: number
  originalPrice: number
  photoUrl: string | null
  bestBefore: string | null
  pickupStart: string | null
  pickupEnd: string | null
  storeName: string
  neighborhood: string | null
  stockQty: number
  status: string
  tipo: BoxTipo
}

export function BoxReserve({ box, onClose }: { box: ReserveBox; onClose?: () => void }) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>("cashOnPickup")
  const [busy, setBusy] = useState(false)
  const [code, setCode] = useState<string | null>(null)
  const off = box.originalPrice > 0 ? Math.round((1 - box.price / box.originalPrice) * 100) : 0
  const saved = Math.max(0, box.originalPrice - box.price)
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
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-pino/12">
      <div className="relative aspect-[16/9] max-h-72 bg-pino/[0.04]">
        {box.photoUrl ? (
          <Image src={box.photoUrl} alt={box.title} fill sizes="(min-width: 640px) 640px, 100vw" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-pino/20"><ShoppingBasketIcon className="size-14" /></div>
        )}
        <RescueBadge className="absolute top-3 left-3 shadow-sm" />
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute top-3 right-3 flex size-10 items-center justify-center rounded-lg bg-white text-pino ring-1 ring-pino/12 transition-colors hover:bg-cream"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </div>
      <div className="px-5 pt-5">
        <ProvenanceChip storeName={box.storeName} />
        <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-0.035em] text-pino">{box.title}</h2>
      </div>

      {code ? (
        <div className="p-5 text-center sm:p-6">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-hoja/15 text-hoja">
            <CheckIcon className="size-7" />
          </div>
          <p className="mt-3 text-xl font-bold text-pino">Reserva confirmada</p>
          <p className="mt-1 text-sm text-hoja">Muestra este código en {box.storeName} al retirar.</p>
          <p className="mt-4 rounded-lg bg-dorado/35 py-3 font-mono text-2xl font-bold tracking-widest text-pino ring-1 ring-pino/12">{code}</p>
          <div className="mt-5 flex gap-2">
            <Button onClick={() => router.push("/reservations")} variant="outline" className="flex-1 border-pino/20">Mis pedidos</Button>
            <Button onClick={onClose ?? (() => router.push("/"))} className="flex-1 bg-pino">Listo</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-5 pt-4">
          <div className="flex flex-wrap gap-2">
            <PickupWindow start={box.pickupStart} end={box.pickupEnd} />
            <ScarcityBadge stock={box.stockQty} />
            <UrgencyChip bestBefore={box.bestBefore} />
          </div>
          {box.description && <p className="text-sm text-pino/80">{box.description}</p>}
          {box.items?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-bold text-pino">Qué incluye</p>
              <ul className="divide-y divide-pino/10 border-y border-pino/10">
                {box.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-2 py-2 text-sm text-pino">
                    <span className="text-hoja">•</span>{it}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg bg-pino/[0.045] px-4 py-3">
            <div>
              <p className="text-xs text-pino/50">Precio rescate</p>
              <p className="text-2xl font-black tracking-[-0.03em] text-pino tabular-nums">{money(box.price)}</p>
              {saved > 0 && <p className="text-sm font-semibold text-hoja">Ahorras {money(saved)}</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-pino/40 line-through tabular-nums">{money(box.originalPrice)}</p>
              {off > 0 && <span className="mt-1 inline-block rounded-full bg-terracota/15 px-2 py-0.5 text-xs font-bold text-terracota">-{off}%</span>}
            </div>
          </div>
          <p className="text-xs text-hoja">Al rescatar esta caja salvas ~{foodKgSaved(box.tipo)} kg de comida y evitas {co2KgSaved(box.tipo)} kg de CO₂ (estimado).</p>

          {soldOut ? (
            <p className="rounded-lg bg-terracota/10 py-3 text-center text-sm font-semibold text-terracota">Agotado por ahora</p>
          ) : (
            <>
              <div>
                <p className="mb-2 text-sm font-bold text-pino">Forma de pago</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("cashOnPickup")}
                    aria-pressed={method === "cashOnPickup"}
                    className={`flex flex-col items-center gap-1 rounded-lg p-3 text-sm font-semibold transition-colors ${method === "cashOnPickup" ? "bg-pino text-white" : "bg-pino/5 text-pino/60 hover:bg-pino/10"}`}
                  >
                    <BanknoteIcon className="size-5" />Efectivo
                    <span className="text-[0.68rem] text-pino/40">Al retirar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("cardMock")}
                    aria-pressed={method === "cardMock"}
                    className={`flex flex-col items-center gap-1 rounded-lg p-3 text-sm font-semibold transition-colors ${method === "cardMock" ? "bg-pino text-white" : "bg-pino/5 text-pino/60 hover:bg-pino/10"}`}
                  >
                    <CreditCardIcon className="size-5" />Tarjeta
                    <span className="text-[0.68rem] text-pino/40">Débito o crédito</span>
                  </button>
                </div>
              </div>
              {method === "cardMock" && (
                <div className="space-y-2 rounded-lg bg-pino/[0.035] p-3 ring-1 ring-pino/10">
                  <Input placeholder="Número de tarjeta" inputMode="numeric" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="MM/AA" />
                    <Input placeholder="CVV" inputMode="numeric" />
                  </div>
                </div>
              )}
              <Button onClick={confirm} disabled={busy} size="lg" className="w-full bg-pino text-base">
                {busy ? "Procesando…" : `Confirmar reserva · ${money(box.price)}`}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
