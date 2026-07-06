import Link from "next/link"
import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SignOutButton } from "@/components/signOutButton"

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/merchant")
  const { data: profile } = await supabase.from("profile").select("role").eq("id", user.id).single()
  if (profile?.role !== "merchant") redirect("/")
  return (
    <div className="min-h-screen bg-cream">
      <header className="flex items-center justify-between border-b border-pino/10 bg-white px-6 py-3">
        <span className="font-display text-lg text-pino">RESCAT · Panel</span>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/merchant">Mis cajas</Link>
          <Link href="/merchant/reservations">Reservas</Link>
          <Link href="/merchant/boxes/new" className="text-hoja">+ Nueva caja</Link>
          <SignOutButton className="h-8 px-3 py-0 text-xs" />
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  )
}
