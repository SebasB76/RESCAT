export type Offer = {
  id: string
  productName: string
  brand: string | null
  category: string | null
  storeName: string
  qty: number
  daysToExpiry: number
  totalValue: number
  price: number
  rescatPrice: number
  autoDiscountPct: number
  level: string
}

const levelStyles: Record<string, { label: string; className: string }> = {
  CRITICO: { label: "CRÍTICO", className: "bg-terracota text-white" },
  ALERTA: { label: "ALERTA", className: "bg-dorado text-white" },
  ADVERTENCIA: { label: "ADVERTENCIA", className: "bg-hoja text-cream" },
}

function money(n: number) {
  return `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function OfferCard({ offer }: { offer: Offer }) {
  const level = levelStyles[offer.level] ?? { label: offer.level, className: "bg-hoja text-cream" }
  const expiryUrgent = offer.daysToExpiry <= 7
  const expiryLabel = `${offer.daysToExpiry} ${offer.daysToExpiry === 1 ? "día" : "días"}`
  return (
    <div className="flex flex-col rounded-2xl border border-pino/10 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg text-pino">{offer.productName}</h3>
          {offer.brand && <p className="text-xs uppercase tracking-wide text-pino/50">{offer.brand}</p>}
          <p className="mt-0.5 text-xs text-hoja">{offer.category} · {offer.storeName}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${level.className}`}>{level.label}</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${expiryUrgent ? "bg-terracota/15 text-terracota" : "bg-dorado/20 text-pino"}`}>
          Vence en · {expiryLabel}
        </span>
        <span className="text-xs text-pino/60">{offer.qty} uds</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-cream px-3 py-2">
          <div className="text-[0.65rem] text-pino/50">Stock</div>
          <div className="font-semibold text-pino">{offer.qty} uds</div>
        </div>
        <div className="rounded-lg bg-terracota/10 px-3 py-2">
          <div className="text-[0.65rem] text-terracota">Valor en riesgo</div>
          <div className="font-semibold text-terracota">{money(offer.totalValue)}</div>
        </div>
        <div className="rounded-lg bg-cream px-3 py-2">
          <div className="text-[0.65rem] text-pino/50">Precio actual</div>
          <div className="font-semibold text-pino/50 line-through">{money(offer.price)}</div>
        </div>
        <div className="rounded-lg bg-hoja/10 px-3 py-2">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[0.65rem] text-hoja">Precio oferta</span>
            <span className="rounded-full bg-dorado px-1.5 py-0.5 text-[0.62rem] font-bold text-white">-{offer.autoDiscountPct}%</span>
          </div>
          <div className="font-display text-lg text-hoja">{money(offer.rescatPrice)}</div>
        </div>
      </div>

      <div className="mt-3 rounded-lg bg-dorado/15 px-3 py-2 text-xs font-medium text-pino">
        Solo rebaja de precio · No combinar en caja sorpresa
      </div>
    </div>
  )
}
