import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import { CatalogBrowser } from "@/components/catalogBrowser"
import type { CatalogProduct } from "@/components/productCard"

export default async function CatalogoPage() {
  const supabase = await createServerClient()
  const [{ data: products }, { data: stores }] = await Promise.all([
    supabase
      .from("product")
      .select("id,name,brand,category,subcategory,price,photoUrl,storeId")
      .order("name"),
    supabase.from("store").select("id,name"),
  ])

  const storeNames = new Map<string, string>((stores ?? []).map((s): [string, string] => [s.id, s.name]))

  const catalog: CatalogProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    photoUrl: p.photoUrl,
    storeId: p.storeId,
    storeName: storeNames.get(p.storeId) ?? "",
  }))

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-pino/10 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="font-display text-lg text-pino">RESCAT · Catálogo</span>
          <Link href="/" className="text-sm text-pino underline">
            ← Volver a cajas
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="font-display text-2xl text-pino">Catálogo de abarrotes</h1>
        <p className="mt-1 text-sm text-hoja">Compra productos individuales y retíralos en la tienda.</p>
        <div className="mt-6">
          <CatalogBrowser products={catalog} />
        </div>
      </main>
    </div>
  )
}
