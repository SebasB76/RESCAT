"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { createBrowserClient } from "@/lib/supabase/client"
import { BoxCard, type DiscoveryBox } from "@/components/boxCard"
import { HeroStats } from "@/components/heroStats"
import { DiscoveryFilters, type SortMode, type ViewMode, type TipoFilter } from "@/components/discoveryFilters"
import { SignOutButton } from "@/components/signOutButton"

const DiscoveryMap = dynamic(() => import("@/components/discoveryMap"), { ssr: false })
const GYE = { lat: -2.1709, lng: -79.9224 }

export default function Home() {
  const supabase = createBrowserClient()
  const [boxes, setBoxes] = useState<DiscoveryBox[]>([])
  const [center, setCenter] = useState(GYE)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [productCount, setProductCount] = useState<number | null>(null)
  const [storeId, setStoreId] = useState<string>("todas")
  const [tipo, setTipo] = useState<TipoFilter>("todos")
  const [sort, setSort] = useState<SortMode>("distance")
  const [view, setView] = useState<ViewMode>("list")

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user))
    supabase.from("store").select("id, name").order("name").then(({ data }) => setStores(data ?? []))
    supabase.from("product").select("id", { count: "exact", head: true }).then(({ count }) => setProductCount(count ?? 0))
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

  const avgSavingsPct = useMemo(() => {
    if (!boxes.length) return null
    const sum = boxes.reduce((acc, b) => acc + (b.originalPrice > 0 ? 1 - b.price / b.originalPrice : 0), 0)
    return Math.round((sum / boxes.length) * 100)
  }, [boxes])

  const filtered = useMemo(() => {
    let list = boxes
    if (storeId !== "todas") list = list.filter((b) => b.storeId === storeId)
    if (tipo !== "todos") list = list.filter((b) => b.tipo === tipo)
    return [...list].sort((a, b) => (sort === "distance" ? a.distanceKm - b.distanceKm : b.storeRating - a.storeRating))
  }, [boxes, storeId, tipo, sort])

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="font-display text-2xl font-semibold text-pino">RES<span className="text-hoja">CAT</span></Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/catalogo" className="text-pino hover:text-hoja">Catálogo</Link>
          {signedIn ? (
            <>
              <Link href="/reservations" className="text-pino hover:text-hoja">Mis reservas</Link>
              <SignOutButton className="h-8 px-3 py-0 text-xs" />
            </>
          ) : (
            <Link href="/login" className="text-pino hover:text-hoja">Entrar</Link>
          )}
        </nav>
      </header>

      <div className="mt-6">
        <HeroStats boxesCount={boxes.length} productCount={productCount} avgSavingsPct={avgSavingsPct} />
      </div>

      {denied && <p className="mt-4 text-sm text-hoja">Mostrando cajas en Guayaquil (activa tu ubicación para ver las más cercanas).</p>}

      <div className="mt-8">
        <DiscoveryFilters
          stores={stores}
          storeId={storeId}
          onStoreChange={setStoreId}
          tipo={tipo}
          onTipoChange={setTipo}
          sort={sort}
          onSortChange={setSort}
          view={view}
          onViewChange={setView}
          resultCount={filtered.length}
        />
      </div>

      {loading ? <p className="mt-10 text-center text-hoja">Buscando cajas…</p>
        : filtered.length === 0 ? <p className="mt-10 text-center text-hoja">No hay cajas disponibles con estos filtros.</p>
        : view === "list"
          ? <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((b) => <BoxCard key={b.id} box={b} />)}</div>
          : <div className="mt-6"><DiscoveryMap boxes={filtered} center={center} /></div>}
    </main>
  )
}
