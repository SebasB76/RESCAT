import Link from "next/link"
import { ShoppingBasketIcon } from "lucide-react"
import { RescueBadge } from "@/components/rescueBadge"
import { ScarcityBadge } from "@/components/scarcityBadge"
import { PickupWindow } from "@/components/pickupWindow"
import { ProvenanceChip } from "@/components/provenanceChip"
import { money } from "@/lib/format"
import { foodKgSaved, co2KgSaved } from "@/lib/impact"

export type BoxTipo = "solo" | "duo" | "familia"

export const TIPO_LABEL: Record<BoxTipo, string> = {
  solo: "Para 1 persona",
  duo: "Para 2 personas",
  familia: "Para la familia",
}

export type DiscoveryBox = {
  id: string
  storeId: string
  title: string
  price: number
  originalPrice: number
  photoUrl: string | null
  bestBefore: string | null
  pickupStart: string
  pickupEnd: string
  storeName: string
  neighborhood: string | null
  lat: number
  lng: number
  distanceKm: number
  storeRating: number
  tipo: BoxTipo
  items: string[]
  stockQty: number
}

export function BoxCard({ box }: { box: DiscoveryBox }) {
  const off = box.originalPrice > 0 ? Math.round((1 - box.price / box.originalPrice) * 100) : 0
  const saved = Math.max(0, box.originalPrice - box.price)
  return (
    <Link
      href={`/?box=${box.id}`}
      scroll={false}
      className="group flex flex-col overflow-hidden rounded-2xl border border-pino/10 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-pino/40 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative h-44 overflow-hidden bg-cream">
        {box.photoUrl ? (
          <img
            src={box.photoUrl}
            alt={box.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-pino/20"><ShoppingBasketIcon className="size-10" /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-pino/80 via-pino/10 to-transparent" />
        <RescueBadge className="absolute top-2.5 left-2.5 shadow-sm" />
        {off > 0 && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-terracota px-2 py-0.5 text-xs font-bold text-white shadow-sm">-{off}%</span>
        )}
        <div className="absolute right-3 bottom-2.5 left-3">
          <h3 className="font-display text-lg leading-tight text-white drop-shadow">{box.title}</h3>
          <p className="text-xs text-white/80">{TIPO_LABEL[box.tipo]}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <ProvenanceChip storeName={box.storeName} distanceKm={box.distanceKm} />
          <span className="shrink-0 text-xs text-dorado">★ {box.storeRating}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <PickupWindow start={box.pickupStart} end={box.pickupEnd} />
          <ScarcityBadge stock={box.stockQty} />
        </div>
        {box.items?.length > 0 && <p className="line-clamp-2 text-xs text-pino/60">{box.items.join(" · ")}</p>}
        <div className="mt-auto flex items-end justify-between border-t border-pino/10 pt-3">
          <div>
            <div className="text-xs text-pino/40 line-through tabular-nums">{money(box.originalPrice)}</div>
            <div className="font-display text-2xl leading-none text-pino tabular-nums">{money(box.price)}</div>
          </div>
          {saved > 0 && (
            <span className="rounded-full bg-dorado/20 px-2 py-0.5 text-xs font-bold text-pino">Ahorras {money(saved)}</span>
          )}
        </div>
        <p className="text-[0.7rem] text-hoja">Salvas ~{foodKgSaved(box.tipo)} kg de comida · {co2KgSaved(box.tipo)} kg CO₂</p>
      </div>
    </Link>
  )
}
