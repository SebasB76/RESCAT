import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { BoxForm } from "@/components/boxForm"
import { createBox, type BoxInput } from "@/actions/boxes"
import { createServerClient } from "@/lib/supabase/server"

export default async function NewBoxPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user!.id).order("createdAt", { ascending: true }).limit(1)
  const storeId = stores?.[0]?.id ?? "00000000-0000-0000-0000-000000000000"
  const { data: products } = await supabase.from("product").select("id,name,brand,price").eq("storeId", storeId).order("name")

  async function onSubmit(input: BoxInput) {
    "use server"
    await createBox(input)
  }
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/merchant/boxes" className="inline-flex items-center gap-1.5 text-sm font-medium text-hoja transition-colors hover:text-pino">
        <ArrowLeftIcon className="size-4" />
        Mis cajas
      </Link>
      <h1 className="mt-3 font-display text-3xl text-pino">Nueva caja</h1>
      <p className="mt-1 text-sm text-pino/60">Publica una caja sorpresa con los productos que quieres rescatar.</p>
      <div className="mt-6">
        <BoxForm
          initial={{ title: "", description: "", items: "", category: "", tipo: "solo", originalPrice: "", price: "", stockQty: "", bestBefore: "", pickupStart: "", pickupEnd: "", photoUrl: null }}
          products={products ?? []}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
