"use client"
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type CartItem = {
  productId: string
  name: string
  price: number
  photoUrl: string | null
  storeId: string
  storeName: string
  qty: number
}

type CartContextValue = {
  items: CartItem[]
  count: number
  total: number
  open: boolean
  setOpen: (open: boolean) => void
  addItem: (item: Omit<CartItem, "qty">) => void
  removeItem: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = "rescat_cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [open, setOpen] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      const valid = Array.isArray(parsed)
        ? parsed.filter((i) => i && typeof i.productId === "string" && typeof i.price === "number" && typeof i.qty === "number" && i.qty > 0)
        : []
      setItems(valid as CartItem[])
    } catch {
      setItems([])
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

  function addItem(item: Omit<CartItem, "qty">) {
    setItems((prev) => {
      const found = prev.find((i) => i.productId === item.productId)
      if (found) return prev.map((i) => (i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function removeItem(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }

  function setQty(productId: string, qty: number) {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, qty } : i)),
    )
  }

  function clear() {
    setItems([])
  }

  const count = items.reduce((s, i) => s + i.qty, 0)
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, count, total, open, setOpen, addItem, removeItem, setQty, clear }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used within CartProvider")
  return ctx
}
