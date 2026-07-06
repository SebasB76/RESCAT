import { CartProvider } from "@/components/cartProvider"
import { Cart } from "@/components/cart"

export default function CatalogoLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <Cart />
    </CartProvider>
  )
}
