import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SignOutButton } from "@/components/signOutButton"
import { StoreSwitcher } from "@/components/storeSwitcher"

const operacion = [
  { href: "/merchant/boxes", label: "Mis cajas" },
  { href: "/merchant/reservations", label: "Reservas" },
  { href: "/merchant/boxes/new", label: "+ Nueva caja" },
]
const analisis = [
  { href: "/merchant", label: "Dashboard" },
  { href: "/merchant/trazabilidad", label: "Trazabilidad" },
  { href: "/merchant/ofertas", label: "Ofertas" },
  { href: "/merchant/cesta", label: "Cesta" },
  { href: "/merchant/ventas", label: "Ventas" },
  { href: "/merchant/ranking", label: "Ranking" },
]

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/merchant")
  const { data: profile } = await supabase.from("profile").select("role").eq("id", user.id).single()
  if (profile?.role !== "merchant") redirect("/")
  const { data: stores } = await supabase.from("store").select("id, name").eq("ownerId", user.id).order("name")

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-pino/10 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <span className="font-display text-lg text-pino">RESCAT · Panel</span>
          <div className="flex items-center gap-3">
            <StoreSwitcher stores={stores ?? []} />
            <SignOutButton className="h-8 px-3 py-0 text-xs" />
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 px-6 pb-3 text-sm">
          <span className="text-xs uppercase tracking-wide text-pino/40">Operación</span>
          {operacion.map((l) => <Link key={l.href} href={l.href} className="text-pino/80 hover:text-pino">{l.label}</Link>)}
          <span className="ml-2 text-xs uppercase tracking-wide text-pino/40">Análisis</span>
          {analisis.map((l) => <Link key={l.href} href={l.href} className="text-pino/80 hover:text-pino">{l.label}</Link>)}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  )
}
