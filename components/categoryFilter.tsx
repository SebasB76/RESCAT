"use client"
import {
  LayoutGrid,
  ShoppingBasket,
  CupSoda,
  Package,
  Ham,
  Carrot,
  Droplet,
  Milk,
  Drumstick,
  Soup,
  Cookie,
  Tag,
  type LucideIcon,
} from "lucide-react"

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Todos: LayoutGrid,
  Abarrotes: ShoppingBasket,
  Bebidas: CupSoda,
  Conservas: Package,
  Embutidos: Ham,
  "Frutas y Verduras": Carrot,
  Grasas: Droplet,
  "Lácteos y Huevos": Milk,
  Proteínas: Drumstick,
  Salsas: Soup,
  "Snacks y Dulces": Cookie,
}

export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: string[]
  value: string
  onChange: (category: string) => void
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
      {categories.map((c) => {
        const Icon = CATEGORY_ICONS[c] ?? Tag
        const active = value === c
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hoja/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${
              active
                ? "bg-pino text-white"
                : "bg-white text-pino/75 ring-1 ring-pino/15 hover:ring-pino/30"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${active ? "text-cream/90" : "text-hoja"}`}
              strokeWidth={2}
              aria-hidden="true"
            />
            {c}
          </button>
        )
      })}
    </div>
  )
}
