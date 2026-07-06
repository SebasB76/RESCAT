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
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const Icon = CATEGORY_ICONS[c] ?? Tag
        const active = value === c
        return (
          <button
            key={c}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(c)}
            className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hoja/40 focus-visible:ring-offset-2 focus-visible:ring-offset-cream active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100 ${
              active
                ? "border-pino bg-pino text-cream shadow-sm"
                : "border-pino/15 bg-white text-pino/80 hover:border-hoja/50 hover:text-pino hover:shadow-sm"
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
