"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboardIcon,
  PackageIcon,
  ClipboardListIcon,
  PlusIcon,
  RouteIcon,
  BadgePercentIcon,
  ShoppingBasketIcon,
  TrendingUpIcon,
  TrophyIcon,
  MenuIcon,
  XIcon,
  LeafIcon,
  type LucideIcon,
} from "lucide-react"
import { StoreSwitcher } from "@/components/storeSwitcher"
import { SignOutButton } from "@/components/signOutButton"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: LucideIcon }
type NavGroup = { label: string; items: NavItem[] }

const groups: NavGroup[] = [
  {
    label: "Operación",
    items: [
      { href: "/merchant/boxes", label: "Mis cajas", icon: PackageIcon },
      { href: "/merchant/reservations", label: "Reservas", icon: ClipboardListIcon },
      { href: "/merchant/boxes/new", label: "Nueva caja", icon: PlusIcon },
    ],
  },
  {
    label: "Análisis",
    items: [
      { href: "/merchant", label: "Dashboard", icon: LayoutDashboardIcon },
      { href: "/merchant/trazabilidad", label: "Trazabilidad", icon: RouteIcon },
      { href: "/merchant/ofertas", label: "Ofertas", icon: BadgePercentIcon },
      { href: "/merchant/cesta", label: "Cesta", icon: ShoppingBasketIcon },
      { href: "/merchant/ventas", label: "Ventas", icon: TrendingUpIcon },
      { href: "/merchant/ranking", label: "Ranking", icon: TrophyIcon },
    ],
  },
]

function isActive(pathname: string, href: string) {
  if (href === "/merchant") return pathname === "/merchant"
  if (href === "/merchant/boxes")
    return pathname === "/merchant/boxes" || (pathname.startsWith("/merchant/boxes/") && pathname !== "/merchant/boxes/new")
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-dorado text-pino">
        <LeafIcon className="size-[18px]" strokeWidth={2.25} />
      </span>
      <span className="font-display text-lg leading-none text-cream">
        RESCAT <span className="text-cream/45">· Panel</span>
      </span>
    </span>
  )
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-cream/40">{group.label}</p>
          <ul className="mt-2 space-y-0.5">
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
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                      active ? "bg-cream/12 text-cream" : "text-cream/70 hover:bg-cream/6 hover:text-cream"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-[18px] shrink-0 transition-colors duration-150",
                        active ? "text-dorado" : "text-cream/50 group-hover:text-cream/80"
                      )}
                      strokeWidth={2}
                    />
                    <span>{item.label}</span>
                    {active && <span className="ml-auto size-1.5 rounded-full bg-dorado" aria-hidden />}
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

function SidebarFooter({ email }: { email: string | null }) {
  return (
    <div className="border-t border-cream/10 p-4">
      {email && (
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cream/10 font-display text-sm text-cream">
            {email.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 truncate text-xs text-cream/60">{email}</span>
        </div>
      )}
      <SignOutButton className="w-full border-cream/20 bg-transparent text-cream hover:bg-cream/10 hover:text-cream" />
    </div>
  )
}

export function MerchantNav({ stores, email }: { stores: { id: string; name: string }[]; email: string | null }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-cream/10 bg-pino px-4 lg:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú de navegación"
          className="flex size-9 items-center justify-center rounded-lg text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
        >
          <MenuIcon className="size-5" />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-pino/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-pino text-cream shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-cream/10 px-4">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="flex size-9 items-center justify-center rounded-lg text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
              >
                <XIcon className="size-5" />
              </button>
            </div>
            <div className="px-4 py-4">
              <StoreSwitcher stores={stores} />
            </div>
            <NavList pathname={pathname} onNavigate={() => setOpen(false)} />
            <SidebarFooter email={email} />
          </div>
        </div>
      )}

      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col bg-pino text-cream lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>
        <div className="px-4 pb-2">
          <StoreSwitcher stores={stores} />
        </div>
        <NavList pathname={pathname} />
        <SidebarFooter email={email} />
      </aside>
    </>
  )
}
