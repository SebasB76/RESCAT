"use client"
import { useCallback, useState } from "react"
import { PlusIcon, ShoppingBasketIcon } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useCart } from "@/components/cartProvider"
import { Button } from "@/components/ui/button"
import { AuthPromptDialog } from "@/components/authPrompt"

export type CatalogProduct = { id: string; name: string; brand: string | null; category: string | null; subcategory: string | null; price: number; photoUrl: string | null; storeId: string; storeName: string }
export function ProductCard({ product, variants, signedIn = null }: { product: CatalogProduct; variants?: CatalogProduct[]; signedIn?: boolean | null }) {
  const { addItem } = useCart()
  const [authOpen, setAuthOpen] = useState(false)
  const all = variants && variants.length > 0 ? variants : [product]
  const cheapest = all.reduce((a, b) => (b.price < a.price ? b : a))
  const others = all.length - 1
  const promotion = cheapest.subcategory?.startsWith("Promo: ") ? cheapest.subcategory.slice(7) : null
  const closeAuth = useCallback(() => setAuthOpen(false), [])
  function add() {
    addItem({ productId: cheapest.id, name: cheapest.name, price: cheapest.price, photoUrl: cheapest.photoUrl, storeId: cheapest.storeId, storeName: cheapest.storeName })
    if (signedIn === false) {
      setAuthOpen(true)
      return
    }
    toast.success(`${cheapest.name} agregado`)
  }
  return (
    <>
      <article className="group flex min-w-0 flex-col bg-white ring-1 ring-pino/12 transition-colors hover:ring-pino/25">
        <div className="relative aspect-square overflow-hidden bg-pino/[0.035]">{product.photoUrl ? <Image src={product.photoUrl} alt={product.name} fill sizes="(min-width: 1280px) 240px, (min-width: 640px) 33vw, 50vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.025] motion-reduce:transform-none" /> : <div className="flex h-full items-center justify-center text-pino/20"><ShoppingBasketIcon className="size-8" /></div>}</div>
        <div className="flex flex-1 flex-col p-3"><p className="text-xs font-semibold text-hoja">{product.brand ?? product.category ?? "Producto local"}</p><h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-pino">{product.name}</h3><p className="mt-1 line-clamp-1 text-xs text-pino/70">{cheapest.storeName}{others > 0 ? ` · +${others} ${others === 1 ? "tienda" : "tiendas"}` : ""}</p>{promotion && <p className="mt-2 self-start rounded-md bg-dorado/35 px-2 py-1 text-xs font-bold text-pino">{promotion}</p>}<div className="mt-auto flex items-center justify-between gap-2 pt-3"><p className="text-lg font-black tracking-[-0.02em] text-pino tabular-nums">{all.length > 1 && <span className="mr-1 text-[0.65rem] font-medium text-pino/70">desde</span>}${cheapest.price.toFixed(2)}</p><Button onClick={add} size="icon-sm" aria-label={`Agregar ${product.name}`} className="size-8 rounded-md bg-dorado text-pino hover:bg-pino hover:text-white"><PlusIcon className="size-4" /></Button></div></div>
      </article>
      <AuthPromptDialog open={authOpen} onClose={closeAuth} next="/?cart=open#catalogo" title="Tu producto ya está en el carrito" description={`Entra para conservar ${cheapest.name} y completar el pedido con código de retiro.`} />
    </>
  )
}
