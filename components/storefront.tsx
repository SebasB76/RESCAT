"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { BoxCard, type DiscoveryBox } from "@/components/boxCard"
import { HeroStats } from "@/components/heroStats"
import { DiscoveryFilters, type SortMode, type ViewMode, type TipoFilter } from "@/components/discoveryFilters"
import { SignOutButton } from "@/components/signOutButton"
import { BoxModal } from "@/components/boxModal"
import { BrandMark } from "@/components/brandMark"
import { CircleCheckIcon, StoreIcon } from "lucide-react"
import { reservationPricing } from "@/lib/pricing"

const DiscoveryMap = dynamic(() => import("@/components/discoveryMap"), { ssr: false })
const GYE = { lat: -2.1709, lng: -79.9224 }

export function Storefront() {
  const searchParams = useSearchParams()
  const boxParam = searchParams.get("box")

  const [boxes, setBoxes] = useState<DiscoveryBox[]>([])
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [center, setCenter] = useState(GYE)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [signedIn, setSignedIn] = useState<boolean | null>(null)

  const [storeId, setStoreId] = useState("todas")
  const [tipo, setTipo] = useState<TipoFilter>("todos")
  const [sort, setSort] = useState<SortMode>("distance")
  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  useEffect(() => {
    const supabase = createBrowserClient()
    let active = true
    ;(async () => {
      const [{ data: userData }, { data: st }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("store").select("id, name").order("name"),
      ])
      if (!active) return
      setSignedIn(!!userData.user)
      setStores(st ?? [])
    })()

    function load(lat: number, lng: number) {
      setCenter({ lat, lng })
      supabase.rpc("list_boxes_near", { p_lat: lat, p_lng: lng }).then(({ data }) => {
        if (!active) return
        setBoxes((data as DiscoveryBox[]) ?? [])
        setLoading(false)
      })
    }
    if (!navigator.geolocation) {
      queueMicrotask(() => {
        if (!active) return
        setDenied(true)
        load(GYE.lat, GYE.lng)
      })
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => load(pos.coords.latitude, pos.coords.longitude),
        () => { setDenied(true); load(GYE.lat, GYE.lng) },
      )
    }
    return () => { active = false }
  }, [])

  const q = search.trim().toLowerCase()

  const filteredBoxes = useMemo(() => {
    let list = boxes
    if (storeId !== "todas") list = list.filter((b) => b.storeId === storeId)
    if (tipo !== "todos") list = list.filter((b) => b.tipo === tipo)
    if (q) list = list.filter((b) => b.title.toLowerCase().includes(q) || b.storeName.toLowerCase().includes(q) || (b.items ?? []).some((it) => it.toLowerCase().includes(q)))
    const ratingOf = (x: DiscoveryBox) => (x.boxReviewCount > 0 ? x.boxRating : x.storeRating)
    return [...list].sort((a, b) => (sort === "distance" ? a.distanceKm - b.distanceKm : ratingOf(b) - ratingOf(a)))
  }, [boxes, storeId, tipo, sort, q])

  const availableStores = useMemo(() => {
    const availableIds = new Set(boxes.map((box) => box.storeId))
    return stores.filter((store) => availableIds.has(store.id))
  }, [boxes, stores])

  const avgSavingsPct = useMemo(() => {
    if (!boxes.length) return null
    const sum = boxes.reduce((acc, b) => {
      const total = reservationPricing(b.price).total
      return acc + (b.originalPrice > total ? 1 - total / b.originalPrice : 0)
    }, 0)
    return Math.round((sum / boxes.length) * 100)
  }, [boxes])

  const featuredBoxes = useMemo(() => {
    return boxes.slice(0, 5)
  }, [boxes])

  return (
    <div className="min-h-dvh overflow-x-clip bg-cream">
        <header className="sticky top-0 z-30 border-b border-pino/12 bg-cream/95 backdrop-blur-md">
          <div className="product-shell flex h-16 items-center justify-between gap-4">
            <BrandMark />
            <nav className="flex items-center gap-4 text-sm font-medium" aria-label="Navegación principal">
              <Link href="/merchant" className="hidden items-center gap-1.5 text-pino/72 transition-colors hover:text-pino md:inline-flex"><StoreIcon className="size-4" /> Soy tienda</Link>
              <a href="#cajas" className="hidden font-semibold text-pino transition-colors hover:text-hoja sm:inline">Cajas</a>
              {signedIn === true ? (
                <>
                  <Link href="/reservations" className="text-pino transition-colors hover:text-hoja">Mis pedidos</Link>
                  <SignOutButton className="hidden sm:inline-flex" />
                </>
              ) : (
                <Link href="/login" className="rounded-lg bg-pino px-4 py-2 text-white transition-colors hover:bg-hoja">Entrar</Link>
              )}
            </nav>
          </div>
        </header>

        <main className="product-shell">
          <HeroStats
            boxesCount={boxes.length}
            avgSavingsPct={avgSavingsPct}
            search={search}
            onSearchChange={setSearch}
            denied={denied}
            featuredBoxes={featuredBoxes}
          />

          <section id="cajas" className="scroll-mt-24 py-12 sm:py-16">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="section-title">Cajas disponibles hoy</h2>
                  <span className="rounded-md bg-pino/[0.06] px-2 py-1 text-xs font-semibold text-pino/72" aria-live="polite">
                    {filteredBoxes.length} {filteredBoxes.length === 1 ? "disponible" : "disponibles"}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-pino/72">Elige por tienda, tamaño o distancia. Una caja reúne varios excedentes con ahorro real.</p>
              </div>
              <div className="inline-flex w-fit items-center gap-2 text-sm text-pino/72">
                <span className="flex size-8 items-center justify-center rounded-lg bg-dorado/55 text-pino"><CircleCheckIcon className="size-4" aria-hidden="true" /></span>
                <p><span className="font-semibold text-pino">Reserva ahora</span> · paga al retirar</p>
              </div>
            </div>
            <DiscoveryFilters
              stores={availableStores}
              storeId={storeId}
              onStoreChange={setStoreId}
              tipo={tipo}
              onTipoChange={setTipo}
              sort={sort}
              onSortChange={setSort}
              view={view}
              onViewChange={setView}
            />
            <div className="mt-7">
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-xl bg-pino/[0.06]" />)}
                </div>
              ) : filteredBoxes.length === 0 ? (
                <div className="border-y border-pino/12 py-14 text-center">
                  <p className="font-semibold text-pino">{boxes.length === 0 ? "No hay cajas disponibles ahora." : "No hay cajas con estos filtros."}</p>
                  <p className="mt-1 text-sm text-pino/72">{boxes.length === 0 ? "Las tiendas están preparando sus próximos rescates. Vuelve a consultar pronto." : "Prueba otra tienda o tamaño."}</p>
                </div>
              ) : view === "list" ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredBoxes.map((b) => <BoxCard key={b.id} box={b} />)}</div>
              ) : (
                <DiscoveryMap boxes={filteredBoxes} center={center} />
              )}
            </div>
          </section>

        </main>

        <footer className="border-t border-pino/15 bg-pino text-white">
          <div className="product-shell flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between"><BrandMark onDark /><p className="max-w-xl text-sm leading-6 text-white/68">Una red de tiendas y rescatistas que convierte excedentes en ahorro local.</p><Link href="/merchant" className="text-sm font-semibold text-dorado hover:text-white">Publicar como tienda →</Link></div>
        </footer>

        {boxParam && <BoxModal id={boxParam} signedIn={signedIn} />}
    </div>
  )
}
