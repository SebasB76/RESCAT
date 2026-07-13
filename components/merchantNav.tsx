"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BadgePercentIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  MenuIcon,
  PackageIcon,
  PlusIcon,
  RouteIcon,
  ShoppingBasketIcon,
  TrendingUpIcon,
  TrophyIcon,
  XIcon,
  type LucideIcon,
} from "lucide-react"
import { BrandMark } from "@/components/brandMark"
import { StoreSwitcher } from "@/components/storeSwitcher"
import { SignOutButton } from "@/components/signOutButton"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: LucideIcon }
type NavGroup = { label: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    label: "Trabajo diario",
    items: [
      { href: "/merchant", label: "Resumen", icon: LayoutDashboardIcon },
      { href: "/merchant/boxes", label: "Cajas publicadas", icon: PackageIcon },
      { href: "/merchant/reservations", label: "Reservas", icon: ClipboardListIcon },
      { href: "/merchant/trazabilidad", label: "Inventario", icon: RouteIcon },
    ],
  },
  {
    label: "Decisiones",
    items: [
      { href: "/merchant/ofertas", label: "Ofertas", icon: BadgePercentIcon },
      { href: "/merchant/cesta", label: "Cestas", icon: ShoppingBasketIcon },
      { href: "/merchant/ventas", label: "Ventas", icon: TrendingUpIcon },
      { href: "/merchant/ranking", label: "Productos", icon: TrophyIcon },
    ],
  },
]

function isActive(pathname: string, href: string) {
  if (href === "/merchant") return pathname === "/merchant"
  if (href === "/merchant/boxes") return pathname === href || (pathname.startsWith(`${href}/`) && pathname !== "/merchant/boxes/new")
  return pathname === href || pathname.startsWith(`${href}/`)
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navegación del comercio">
      {groups.map((group, index) => (
        <div key={group.label} className={index > 0 ? "mt-7" : ""}>
          <p className="px-3 text-xs font-semibold text-pino/70">{group.label}</p>
          <ul className="mt-2 space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href)
              const Icon = item.icon
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                      active ? "bg-pino text-white" : "text-pino/75 hover:bg-pino/[0.06] hover:text-pino",
                    )}
                  >
                    <Icon className={cn("size-[18px] shrink-0", active ? "text-dorado" : "text-pino/48")} strokeWidth={2} />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function SidebarContent({ stores, email, pathname, onNavigate }: { stores: { id: string; name: string }[]; email: string | null; pathname: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="border-b border-pino/10 px-4 pb-4">
        <StoreSwitcher stores={stores} />
        <Link href="/merchant/boxes/new" onClick={onNavigate} className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-lg bg-dorado px-3 text-sm font-bold text-pino transition-colors hover:bg-pino hover:text-white">
          <PlusIcon className="size-4" /> Publicar caja
        </Link>
      </div>
      <NavList pathname={pathname} onNavigate={onNavigate} />
      <div className="border-t border-pino/10 p-4">
        {email && <p className="mb-3 truncate text-xs text-pino/70">Sesión: {email}</p>}
        <SignOutButton className="w-full justify-start bg-transparent text-pino/65 ring-1 ring-pino/15 hover:bg-pino/5 hover:text-pino" />
      </div>
    </>
  )
}

export function MerchantNav({ stores, email }: { stores: { id: string; name: string }[]; email: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-pino/12 bg-cream px-4 lg:hidden">
        <BrandMark href="/merchant" panel />
        <button type="button" onClick={() => setOpen(true)} aria-label="Abrir menú" className="flex size-10 items-center justify-center rounded-lg text-pino hover:bg-pino/5">
          <MenuIcon className="size-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-pino/45" onClick={() => setOpen(false)} aria-label="Cerrar menú" />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[86%] flex-col bg-cream shadow-xl">
            <div className="flex h-16 items-center justify-between px-4">
              <BrandMark href="/merchant" panel />
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar menú" className="flex size-10 items-center justify-center rounded-lg text-pino hover:bg-pino/5"><XIcon className="size-5" /></button>
            </div>
            <SidebarContent stores={stores} email={email} pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-pino/12 bg-cream lg:flex">
        <div className="flex h-20 items-center px-5"><BrandMark href="/merchant" panel /></div>
        <SidebarContent stores={stores} email={email} pathname={pathname} />
      </aside>
    </>
  )
}
