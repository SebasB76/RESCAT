"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { money } from "@/lib/format"
import { toast } from "sonner"

export function MerchantLive() {
  const router = useRouter()
  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel("merchant-reservations")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reservation" }, (payload) => {
        const row = payload.new as { code?: string; amount?: number; total?: number }
        const customerTotal = row.total ?? row.amount
        toast.success(`Nueva reserva · ${row.code ?? ""}`, {
          description: customerTotal != null ? `${money(Number(customerTotal))} total · toca Reservas para ver` : undefined,
        })
        router.refresh()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [router])
  return null
}
