"use client"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  async function signOut() {
    await createBrowserClient().auth.signOut()
    router.push("/")
    router.refresh()
  }
  return (
    <Button variant="outline" onClick={signOut} className={className}>
      Cerrar sesión
    </Button>
  )
}
