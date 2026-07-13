import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { MerchantNav } from "@/components/merchantNav"
import { MerchantLive } from "@/components/merchantLive"

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/merchant")
  const { data: profile } = await supabase.from("profile").select("role").eq("id", user.id).single()
  if (profile?.role !== "merchant") redirect("/")
  const { data: stores } = await supabase.from("store").select("id, name").eq("ownerId", user.id).order("name")

  return (
    <div className="min-h-dvh bg-cream lg:flex">
      <MerchantLive />
      <MerchantNav stores={stores ?? []} email={user.email ?? null} />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  )
}
