"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { BoxCard, type DiscoveryBox } from "@/components/boxCard"
import { ProductCard, type CatalogProduct } from "@/components/productCard"
import { HeroStats } from "@/components/heroStats"
import { DiscoveryFilters, type SortMode, type ViewMode, type TipoFilter } from "@/components/discoveryFilters"
import { SignOutButton } from "@/components/signOutButton"
import { CartProvider } from "@/components/cartProvider"
import { Cart } from "@/components/cart"
import { BoxModal } from "@/components/boxModal"
import { CategoryFilter } from "@/components/categoryFilter"
import { Input } from "@/components/ui/input"

const DiscoveryMap = dynamic(() => import("@/components/discoveryMap"), { ssr: false })
const GYE = { lat: -2.1709, lng: -79.9224 }

export function Storefront() {
  const searchParams = useSearchParams()
  const boxParam = searchParams.get("box")

  const [boxes, setBoxes] = useState<DiscoveryBox[]>([])
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [center, setCenter] = useState(GYE)
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [signedIn, setSignedIn] = useState(false)

  const [storeId, setStoreId] = useState("todas")
  const [tipo, setTipo] = useState<TipoFilter>("todos")
  const [sort, setSort] = useState<SortMode>("distance")
  const [view, setView] = useState<ViewMode>("list")
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Todos")

  useEffect(() => {
    const supabase = createBrowserClient()
    let active = true
    ;(async () => {
      const [{ data: userData }, { data: st }, { data: prods }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("store").select("id, name").order("name"),
        supabase.from("product").select("id,name,brand,category,subcategory,price,photoUrl,storeId").order("name"),
      ])
      if (!active) return
      setSignedIn(!!userData.user)
      setStores(st ?? [])
      const names = new Map((st ?? []).map((s): [string, string] => [s.id, s.name]))
      setProducts((prods ?? []).map((p) => ({ ...p, storeName: names.get(p.storeId) ?? "" })))
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
      setDenied(true)
      load(GYE.lat, GYE.lng)
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

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => { if (p.category) set.add(p.category) })
    return ["Todos", ...Array.from(set).sort()]
  }, [products])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (storeId !== "todas" && p.storeId !== storeId) return false
      if (category !== "Todos" && p.category !== category) return false
      if (q && !(p.name.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q))) return false
      return true
    })
  }, [products, storeId, category, q])

  const productGroups = useMemo(() => {
    const map = new Map<string, CatalogProduct[]>()
    for (const p of filteredProducts) {
      const key = `${p.name}|${p.brand ?? ""}`
      const arr = map.get(key)
      if (arr) arr.push(p)
      else map.set(key, [p])
    }
    return Array.from(map.entries())
  }, [filteredProducts])

  const avgSavingsPct = useMemo(() => {
    if (!boxes.length) return null
    const sum = boxes.reduce((acc, b) => acc + (b.originalPrice > 0 ? 1 - b.price / b.originalPrice : 0), 0)
    return Math.round((sum / boxes.length) * 100)
  }, [boxes])

  return (
    <CartProvider>
      <div className="min-h-dvh bg-cream">
        <header className="sticky top-0 z-30 border-b border-pino/10 bg-cream/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center" aria-label="RESCAT">
              <img src="/logo.png" alt="RESCAT" className="h-8 w-auto" />
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <a href="#catalogo" className="hidden text-pino hover:text-hoja sm:inline">Catálogo</a>
              {signedIn ? (
                <>
                  <Link href="/reservations" className="text-pino hover:text-hoja">Mis pedidos</Link>
                  <SignOutButton className="h-8 px-3 py-0 text-xs" />
                </>
              ) : (
                <Link href="/login" className="rounded-lg bg-pino px-3 py-1.5 text-cream transition hover:bg-pino/90">Entrar</Link>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <HeroStats boxesCount={boxes.length} productCount={products.length} avgSavingsPct={avgSavingsPct} />

          <div className="mt-6">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar caja o producto…" className="h-11 max-w-xl" />
          </div>

          {denied && <p className="mt-4 text-sm text-hoja">Mostrando resultados en Guayaquil (activa tu ubicación para ver lo más cercano).</p>}

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="font-display text-xl text-pino">Cajas sorpresa</h2>
              <p className="text-sm text-hoja">Sorpresas de productos por vencer a precio rescate.</p>
            </div>
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
              resultCount={filteredBoxes.length}
            />
            <div className="mt-6">
              {loading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/60" />)}
                </div>
              ) : filteredBoxes.length === 0 ? (
                <p className="py-12 text-center text-hoja">No hay cajas con estos filtros.</p>
              ) : view === "list" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filteredBoxes.map((b) => <BoxCard key={b.id} box={b} />)}</div>
              ) : (
                <DiscoveryMap boxes={filteredBoxes} center={center} />
              )}
            </div>
          </section>

          <section id="catalogo" className="mt-12 scroll-mt-20 border-t border-pino/10 pt-10">
            <div className="mb-4">
              <h2 className="font-display text-xl text-pino">Catálogo de abarrotes</h2>
              <p className="text-sm text-pino/70">Compra productos individuales y retíralos en la tienda.</p>
            </div>
            <div className="mb-6">
              <CategoryFilter categories={categories} value={category} onChange={setCategory} />
            </div>
            {productGroups.length === 0 ? (
              <p className="py-12 text-center text-hoja">No hay productos que coincidan.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {productGroups.map(([key, variants]) => <ProductCard key={key} product={variants[0]} variants={variants} />)}
              </div>
            )}
          </section>
        </main>

        <Cart />
        {boxParam && <BoxModal id={boxParam} />}
      </div>
    </CartProvider>
  )
}
