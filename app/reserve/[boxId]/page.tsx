"use client"
import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { reserveBox } from "@/actions/reservations"
import { processPayment, type PaymentMethod } from "@/lib/payment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function ReservePage({ params }: { params: Promise<{ boxId: string }> }) {
  const { boxId } = use(params)
  const supabase = createBrowserClient()
  const router = useRouter()
  const [box, setBox] = useState<{ title: string; price: number } | null>(null)
  const [method, setMethod] = useState<PaymentMethod>("cashOnPickup")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from("box").select("title,price").eq("id", boxId).single().then(({ data }) => setBox(data))
  }, [boxId])

  async function confirm() {
    if (!box) return
    setBusy(true)
    const pay = await processPayment(method, box.price)
    if (!pay.ok) { toast.error("El pago no se pudo procesar"); setBusy(false); return }
    try {
      const reservation = await reserveBox(boxId, method)
      router.push(`/reservations?code=${reservation.code}`)
    } catch (e) {
      toast.error(e instanceof Error && e.message === "out_of_stock" ? "Se agotó justo ahora 😔" : "No se pudo reservar")
      setBusy(false)
    }
  }

  if (!box) return <main className="p-10 text-center text-hoja">Cargando…</main>
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <h1 className="font-display text-2xl text-pino">Reservar</h1>
      <div className="mt-4 rounded-xl bg-white p-4">
        <div className="flex justify-between"><span>{box.title}</span><span className="font-display text-lg">${box.price}</span></div>
      </div>
      <div className="mt-4 space-y-2">
        <label className="flex items-center gap-2"><input type="radio" checked={method === "cashOnPickup"} onChange={() => setMethod("cashOnPickup")} /> Pagar en efectivo al retirar</label>
        <label className="flex items-center gap-2"><input type="radio" checked={method === "cardMock"} onChange={() => setMethod("cardMock")} /> Pagar con tarjeta</label>
      </div>
      {method === "cardMock" && (
        <div className="mt-3 space-y-2 rounded-xl border border-pino/10 bg-white p-3">
          <Input placeholder="Número de tarjeta" />
          <div className="grid grid-cols-2 gap-2"><Input placeholder="MM/AA" /><Input placeholder="CVV" /></div>
          <p className="text-xs text-hoja">Pago simulado — no se realiza ningún cobro real.</p>
        </div>
      )}
      <Button onClick={confirm} disabled={busy} className="mt-4 w-full bg-pino">{busy ? "Procesando…" : "Confirmar reserva"}</Button>
    </main>
  )
}
