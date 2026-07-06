import Link from "next/link"
import { UrgencyChip } from "@/components/urgencyChip"
import { money } from "@/lib/format"

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
  return (
    <Link
      href={`/?box=${box.id}`}
      scroll={false}
      className="group flex flex-col overflow-hidden rounded-2xl border border-pino/10 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-pino/40 focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      <div className="relative h-44 overflow-hidden bg-cream">
        {box.photoUrl && (
          <img
            src={box.photoUrl}
            alt={box.title}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-pino/80 via-pino/10 to-transparent" />
        <span className="absolute top-2.5 left-2.5 rounded-full border border-white/25 bg-white/15 px-2 py-0.5 text-[0.65rem] font-semibold tracking-wide text-white uppercase backdrop-blur">
          {TIPO_LABEL[box.tipo]}
        </span>
        {off > 0 && (
          <span className="absolute top-2.5 right-2.5 rounded-full bg-terracota px-2 py-0.5 text-xs font-bold text-white">
            -{off}%
          </span>
        )}
        <div className="absolute right-3 bottom-2.5 left-3 flex items-end justify-between gap-2">
          <h3 className="font-display text-lg leading-tight text-white drop-shadow">{box.title}</h3>
          <span className="shrink-0 rounded-full bg-white/90 px-2 py-0.5 text-[0.65rem] font-semibold text-pino">
            {box.stockQty} disp.
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs text-hoja">{box.storeName} · {box.distanceKm.toFixed(1)} km</p>
          <span className="shrink-0 text-xs text-dorado">★ {box.storeRating}</span>
        </div>
        {box.items?.length > 0 && (
          <p className="mt-1.5 line-clamp-2 text-xs text-pino/60">{box.items.join(" · ")}</p>
        )}
        <div className="mt-2">
          <UrgencyChip bestBefore={box.bestBefore} />
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-pino/10 pt-3">
          <span className="flex items-baseline gap-1.5">
            <span className="text-sm text-pino/40 line-through tabular-nums">{money(box.originalPrice)}</span>
            <span className="font-display text-xl text-pino tabular-nums">{money(box.price)}</span>
          </span>
          <span className="rounded-lg bg-pino px-3 py-1.5 text-xs font-semibold text-cream transition group-hover:bg-hoja">
            Ver y reservar
          </span>
        </div>
      </div>
    </Link>
  )
}
