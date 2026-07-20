"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon, MapPinIcon, StarIcon } from "lucide-react"
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { DiscoveryBox } from "@/components/boxCard"
import { PickupWindow } from "@/components/pickupWindow"
import { money } from "@/lib/format"
import { boxCoverFor } from "@/lib/boxCover"
import { reservationPricing } from "@/lib/pricing"

function pricePin(price: number, active: boolean) {
  const background = active ? "#E7F51B" : "#073B24"
  const color = active ? "#073B24" : "#FFFFFF"
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;justify-content:center;min-width:54px;height:30px;padding:0 9px;border-radius:9px;background:${background};color:${color};font:700 13px system-ui;border:2px solid white;box-shadow:0 2px 6px rgba(7,59,36,.24)">$${price.toFixed(2)}</div>`,
    iconSize: [54, 30],
    iconAnchor: [27, 30],
  })
}

function FocusSelected({ box }: { box: DiscoveryBox | undefined }) {
  const map = useMap()
  useEffect(() => {
    if (box) map.flyTo([box.lat, box.lng], Math.max(map.getZoom(), 14), { duration: 0.45 })
  }, [box, map])
  return null
}

function BoxThumb({ box, size = 64 }: { box: DiscoveryBox; size?: number }) {
  return <Image src={boxCoverFor(box)} alt="" width={size} height={size} className="size-16 shrink-0 rounded-lg object-cover" />
}

export default function DiscoveryMap({ boxes, center }: { boxes: DiscoveryBox[]; center: { lat: number; lng: number } }) {
  const [activeId, setActiveId] = useState(boxes[0]?.id ?? "")
  const activeBox = boxes.find((box) => box.id === activeId) ?? boxes[0]

  if (!boxes.length) {
    return <div className="flex min-h-96 items-center justify-center rounded-xl bg-white text-sm text-pino/65 ring-1 ring-pino/12">No hay cajas para mostrar en el mapa.</div>
  }

  return (
    <section className="overflow-hidden rounded-xl bg-white ring-1 ring-pino/12 lg:grid lg:grid-cols-[minmax(0,1fr)_22rem]" aria-label="Mapa de cajas cercanas">
      <div className="relative isolate h-[68vh] min-h-[32rem] bg-pino/[0.035]">
        <MapContainer center={[center.lat, center.lng]} zoom={13} className="z-0 h-full w-full" zoomControl scrollWheelZoom>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap" />
          <FocusSelected box={activeBox} />
          {boxes.map((box) => (
            <Marker
              key={box.id}
              position={[box.lat, box.lng]}
              icon={pricePin(reservationPricing(box.price).total, box.id === activeBox?.id)}
              eventHandlers={{ click: () => setActiveId(box.id) }}
              title={`${box.title}, ${money(reservationPricing(box.price).total)}`}
            />
          ))}
        </MapContainer>

        {activeBox && (
          <Link href={`/?box=${activeBox.id}`} scroll={false} className="absolute inset-x-3 bottom-3 z-10 flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-pino/12 transition-colors hover:bg-cream lg:hidden">
            <BoxThumb box={activeBox} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold text-pino">{activeBox.title}</span>
              <span className="mt-0.5 block truncate text-xs text-pino/65">{activeBox.storeName} · {activeBox.distanceKm.toFixed(1)} km</span>
              <span className="mt-1 block text-base font-black tabular-nums text-pino">{money(reservationPricing(activeBox.price).total)}</span>
            </span>
            <ArrowRightIcon className="size-4 shrink-0 text-hoja" aria-hidden="true" />
          </Link>
        )}
      </div>

      <aside className="hidden max-h-[68vh] min-h-[32rem] flex-col lg:flex">
        <header className="border-b border-pino/10 p-4">
          <h3 className="flex items-center gap-2 text-base font-bold text-pino"><MapPinIcon className="size-4 text-hoja" /> Cajas en el mapa</h3>
          <p className="mt-1 text-xs text-pino/65">{boxes.length} {boxes.length === 1 ? "caja disponible" : "cajas disponibles"} · selecciona una para centrarla</p>
        </header>
        <div className="flex-1 divide-y divide-pino/8 overflow-y-auto">
          {boxes.map((box) => {
            const active = box.id === activeBox?.id
            const rating = box.boxReviewCount > 0 ? box.boxRating : box.storeRating
            return (
              <div key={box.id} className={active ? "bg-hoja/[0.055]" : "bg-white"}>
                <button type="button" onClick={() => setActiveId(box.id)} aria-pressed={active} className="flex w-full gap-3 p-3 text-left transition-colors hover:bg-pino/[0.035]">
                  <BoxThumb box={box} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-pino">{box.title}</span>
                    <span className="mt-0.5 block truncate text-xs text-pino/65">{box.storeName}</span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-sm font-black tabular-nums text-pino">{money(reservationPricing(box.price).total)}</span>
                      <span className="flex items-center gap-1 text-xs font-semibold text-pino/65"><StarIcon className="size-3 fill-dorado text-dorado" /> {rating.toFixed(1)}</span>
                    </span>
                  </span>
                </button>
                {active && (
                  <div className="px-3 pb-3">
                    <div className="mb-2 flex flex-wrap gap-1.5"><PickupWindow start={box.pickupStart} end={box.pickupEnd} /><span className="inline-flex items-center rounded-md bg-pino/[0.055] px-2 py-1 text-xs font-semibold text-pino/65">{box.distanceKm.toFixed(1)} km</span></div>
                    <Link href={`/?box=${box.id}`} scroll={false} className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-pino px-3 text-sm font-bold text-white transition-colors hover:bg-hoja">Ver y reservar <ArrowRightIcon className="size-4" /></Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </aside>
    </section>
  )
}
