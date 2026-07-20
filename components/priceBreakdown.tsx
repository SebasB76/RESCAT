import { money } from "@/lib/format"
import type { ReservationPricing } from "@/lib/pricing"

export function PriceBreakdown({ pricing, compact = false }: {
  pricing: ReservationPricing
  compact?: boolean
}) {
  const percent = Math.round(pricing.commissionRate * 100)
  return (
    <dl className={compact ? "space-y-1.5 text-sm" : "space-y-2 text-sm"}>
      <div className="flex items-center justify-between gap-4 text-pino/70">
        <dt>Precio de la caja</dt>
        <dd className="tabular-nums">{money(pricing.subtotal)}</dd>
      </div>
      <div className="flex items-center justify-between gap-4 text-pino/70">
        <dt>Comisión RESCAT · {percent}%</dt>
        <dd className="tabular-nums">{money(pricing.commissionAmount)}</dd>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-pino/12 pt-2 font-bold text-pino">
        <dt>Total a pagar</dt>
        <dd className={compact ? "tabular-nums" : "text-lg tabular-nums"}>{money(pricing.total)}</dd>
      </div>
    </dl>
  )
}
