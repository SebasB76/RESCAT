import Link from "next/link"
import Image from "next/image"
import { ArrowUpRightIcon, StarIcon } from "lucide-react"
import { RescueBadge } from "@/components/rescueBadge"
import { ScarcityBadge } from "@/components/scarcityBadge"
import { PickupWindow } from "@/components/pickupWindow"
import { ProvenanceChip } from "@/components/provenanceChip"
import { money } from "@/lib/format"
import { foodKgSaved } from "@/lib/impact"
import { boxCoverFor } from "@/lib/boxCover"
import { discountPercent, reservationPricing } from "@/lib/pricing"

export type BoxTipo = "solo" | "duo" | "familia"
export const TIPO_LABEL: Record<BoxTipo, string> = { solo: "Individual", duo: "Para dos", familia: "Familiar" }
export type DiscoveryBox = { id: string; storeId: string; title: string; price: number; originalPrice: number; photoUrl: string | null; bestBefore: string | null; pickupStart: string; pickupEnd: string; storeName: string; neighborhood: string | null; lat: number; lng: number; distanceKm: number; storeRating: number; boxRating: number; boxReviewCount: number; tipo: BoxTipo; items: string[]; stockQty: number }

export function BoxCard({ box }: { box: DiscoveryBox }) {
  const pricing = reservationPricing(box.price)
  const off = discountPercent(box.originalPrice, pricing.total)
  const saved = Math.max(0, box.originalPrice - pricing.total)
  const rating = box.boxReviewCount > 0 ? box.boxRating : box.storeRating
  const cover = boxCoverFor(box)
  return (
    <Link href={`/?box=${box.id}`} scroll={false} className="group flex min-w-0 flex-col rounded-xl bg-white p-2 ring-1 ring-pino/12 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:ring-pino/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hoja">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-pino/[0.045]">
        <Image src={cover} alt={`Caja ${box.title} preparada por ${box.storeName}`} fill sizes="(min-width: 1280px) 390px, (min-width: 768px) 50vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none" />
        <RescueBadge className="absolute left-2 top-2" />
        {off > 0 && <span className="absolute right-2 top-2 rounded-md bg-dorado px-2 py-1 text-xs font-black text-pino">−{off}%</span>}
      </div>
      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="mb-1 text-xs font-semibold text-hoja">{TIPO_LABEL[box.tipo]}</p><h3 className="line-clamp-2 text-lg font-bold leading-5 text-pino">{box.title}</h3></div><ArrowUpRightIcon className="mt-0.5 size-4 shrink-0 text-pino/35 transition-colors group-hover:text-pino" /></div>
        <div className="mt-3"><ProvenanceChip storeName={box.storeName} distanceKm={box.distanceKm} /></div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5"><PickupWindow start={box.pickupStart} end={box.pickupEnd} /><ScarcityBadge stock={box.stockQty} />{rating > 0 && <span className="inline-flex items-center gap-1 text-xs font-semibold text-pino/65"><StarIcon className="size-3 fill-dorado text-dorado" />{rating}{box.boxReviewCount > 0 && ` (${box.boxReviewCount})`}</span>}</div>
        {box.items?.length > 0 && <p className="mt-3 line-clamp-2 text-sm leading-5 text-pino/72">{box.items.join(" · ")}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-pino/10 pt-3">
          <div>
            {box.originalPrice > pricing.total && <p className="text-xs text-pino/70 line-through tabular-nums">{money(box.originalPrice)}</p>}
            <p className="text-2xl font-black leading-none tracking-[-0.03em] text-pino tabular-nums">{money(pricing.total)}</p>
            <p className="mt-1 text-[0.68rem] text-pino/65">Total · incluye comisión 7%</p>
          </div>
          <div className="text-right">{saved > 0 && <p className="text-xs font-bold text-hoja">Ahorras {money(saved)}</p>}<p className="mt-1 text-[0.68rem] text-pino/70">Salvas ~{foodKgSaved(box.tipo)} kg</p></div>
        </div>
      </div>
    </Link>
  )
}
