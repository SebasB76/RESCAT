"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { createBrowserClient } from "@/lib/supabase/client"
import { BoxCard, type DiscoveryBox } from "@/components/boxCard"

const GYE = { lat: -2.1709, lng: -79.9224 }

export default function Home() {
  const supabase = createBrowserClient()
  const [boxes, setBoxes] = useState<DiscoveryBox[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    function load(lat: number, lng: number) {
      supabase.rpc("list_boxes_near", { p_lat: lat, p_lng: lng }).then(({ data }) => {
        setBoxes((data as DiscoveryBox[]) ?? [])
        setLoading(false)
      })
    }
    if (!navigator.geolocation) { setDenied(true); load(GYE.lat, GYE.lng); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => load(pos.coords.latitude, pos.coords.longitude),
      () => { setDenied(true); load(GYE.lat, GYE.lng) },
    )
  }, [])

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-pino">Rescata comida cerca de ti</h1>
          {denied && <p className="text-sm text-hoja">Mostrando cajas en Guayaquil (activa tu ubicación para ver las más cercanas).</p>}
        </div>
        <Link href="/login" className="text-sm text-pino underline">Entrar</Link>
      </div>
      {loading ? <p className="mt-10 text-center text-hoja">Buscando cajas…</p>
        : boxes.length === 0 ? <p className="mt-10 text-center text-hoja">No hay cajas disponibles ahora mismo.</p>
        : <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{boxes.map((b) => <BoxCard key={b.id} box={b} />)}</div>}
    </main>
  )
}
