"use client"
import { toast } from "sonner"
import { useCart } from "@/components/cartProvider"
import { Button } from "@/components/ui/button"

export type CatalogProduct = {
  id: string
  name: string
  brand: string | null
  category: string | null
  subcategory: string | null
  price: number
  photoUrl: string | null
  storeId: string
  storeName: string
}

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { addItem } = useCart()

  function add() {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      photoUrl: product.photoUrl,
      storeId: product.storeId,
      storeName: product.storeName,
    })
    toast.success(`${product.name} agregado`)
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-pino/10 bg-white shadow-sm">
      <div className="flex h-32 items-center justify-center bg-cream">
        {product.photoUrl ? (
          <img src={product.photoUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl opacity-40">🛒</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="text-sm font-medium leading-tight text-pino">{product.name}</h3>
        <p className="mt-0.5 text-xs text-hoja">
          {product.brand && <span className="font-semibold">{product.brand}</span>}
          {product.brand && product.subcategory ? " · " : ""}
          {product.subcategory}
        </p>
        <p className="mt-1 font-display text-lg text-pino">${product.price.toFixed(2)}</p>
        <p className="text-[0.68rem] text-pino/50">{product.storeName}</p>
        <Button
          onClick={add}
          variant="outline"
          className="mt-2 w-full border-hoja text-hoja hover:bg-pino hover:text-white"
        >
          Agregar
        </Button>
      </div>
    </div>
  )
}
