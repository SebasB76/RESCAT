"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@/lib/supabase/client"
import { BoxCard, type DiscoveryBox } from "@/components/boxCard"
import { Button } from "@/components/ui/button"
import { SignOutButton } from "@/components/signOutButton"

const DiscoveryMap = dynamic(() => import("@/components/discoveryMap"), { ssr: false })
const GYE = { lat: -2.1709, lng: -79.9224 }

export default function Home() {
  const supabase = createBrowserClient()
  const [boxes, setBoxes] = useState<DiscoveryBox[]>([])
  const [center, setCenter] = useState(GYE)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [view, setView] = useState<"list" | "map">("list")
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
    function load(lat: number, lng: number) {
      setCenter({ lat, lng })
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
        <div className="flex items-center gap-3">
          {signedIn ? (
            <>
              <Link href="/reservations" className="text-sm text-pino underline">Mis reservas</Link>
              <SignOutButton className="h-8 px-3 py-0 text-xs" />
            </>
          ) : (
            <Link href="/login" className="text-sm text-pino underline">Entrar</Link>
          )}
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")} className={view === "list" ? "bg-pino" : ""}>Lista</Button>
        <Button variant={view === "map" ? "default" : "outline"} onClick={() => setView("map")} className={view === "map" ? "bg-pino" : ""}>Mapa</Button>
      </div>
      {loading ? <p className="mt-10 text-center text-hoja">Buscando cajas…</p>
        : boxes.length === 0 ? <p className="mt-10 text-center text-hoja">No hay cajas disponibles ahora mismo.</p>
        : view === "list"
          ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{boxes.map((b) => <BoxCard key={b.id} box={b} />)}</div>
          : <div className="mt-6"><DiscoveryMap boxes={boxes} center={center} /></div>}
    </main>
  )
}
