"use client"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { ProductCard, type CatalogProduct } from "@/components/productCard"

export function CatalogBrowser({ products }: { products: CatalogProduct[] }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("Todos")

  const categories = useMemo(() => {
    const set = new Set<string>()
    products.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ["Todos", ...Array.from(set).sort()]
  }, [products])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return products.filter((p) => {
      const okCategory = category === "Todos" || p.category === category
      const okQuery =
        !q || p.name.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q)
      return okCategory && okQuery
    })
  }, [products, query, category])

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar producto o marca…"
        className="h-10 max-w-md"
      />
      <div className="mt-4 mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              category === c
                ? "border-pino bg-pino text-cream"
                : "border-pino/20 text-pino/70 hover:border-hoja hover:text-hoja"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="py-16 text-center text-hoja">No hay productos que coincidan.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
