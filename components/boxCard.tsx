import Link from "next/link"
import { UrgencyChip } from "@/components/urgencyChip"

export type DiscoveryBox = {
  id: string; title: string; price: number; originalPrice: number
  photoUrl: string | null; bestBefore: string | null; storeName: string
  neighborhood: string | null; lat: number; lng: number; distanceKm: number; storeRating: number
}

export function BoxCard({ box }: { box: DiscoveryBox }) {
  const off = Math.round((1 - box.price / box.originalPrice) * 100)
  return (
    <Link href={`/box/${box.id}`} className="overflow-hidden rounded-2xl border border-pino/10 bg-white shadow-sm">
      <div className="relative h-40 bg-cream">
        {box.photoUrl && <img src={box.photoUrl} alt={box.title} className="h-full w-full object-cover" />}
        <span className="absolute right-2 top-2 rounded-full bg-terracota px-2 py-0.5 text-xs font-bold text-white">-{off}%</span>
      </div>
      <div className="space-y-1 p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-pino">{box.title}</h3>
          <span className="text-sm text-dorado">★ {box.storeRating}</span>
        </div>
        <p className="text-sm text-hoja">{box.storeName} · {box.neighborhood} · {box.distanceKm.toFixed(1)} km</p>
        <div className="flex items-center justify-between pt-1">
          <UrgencyChip bestBefore={box.bestBefore} />
          <span><span className="text-sm text-pino/50 line-through">${box.originalPrice}</span> <span className="font-display text-lg text-pino">${box.price}</span></span>
        </div>
      </div>
    </Link>
  )
}
