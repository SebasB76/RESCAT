import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeftIcon } from "lucide-react"
import { BoxForm } from "@/components/boxForm"
import { updateBox, type BoxInput } from "@/actions/boxes"
import { createServerClient } from "@/lib/supabase/server"

export default async function EditBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: b } = await supabase.from("box").select("*").eq("id", id).single()
  if (!b) notFound()

  const [{ data: products }, { data: items }] = await Promise.all([
    supabase.from("product").select("id,name,brand,price").eq("storeId", b.storeId).order("name"),
    supabase.from("box_item").select("productId, qty").eq("boxId", id),
  ])
  const initialProducts = (items ?? []).map((i) => ({ productId: i.productId, qty: i.qty }))

  async function onSubmit(input: BoxInput) {
    "use server"
    await updateBox(id, input)
  }
  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/merchant/boxes" className="inline-flex items-center gap-1.5 text-sm font-medium text-hoja transition-colors hover:text-pino">
        <ArrowLeftIcon className="size-4" />
        Mis cajas
      </Link>
      <h1 className="mt-3 font-display text-3xl text-pino">Editar caja</h1>
      <p className="mt-1 text-sm text-pino/60">Actualiza los datos de <span className="font-medium text-pino">{b.title}</span>.</p>
      <div className="mt-6">
        <BoxForm
          initial={{
            title: b.title, description: b.description ?? "", items: (b.items ?? []).join("\n"),
            category: b.category ?? "", tipo: b.tipo, originalPrice: String(b.originalPrice), price: String(b.price),
            stockQty: String(b.stockQty), bestBefore: b.bestBefore ?? "",
            pickupStart: b.pickupStart.slice(0, 16), pickupEnd: b.pickupEnd.slice(0, 16), photoUrl: b.photoUrl,
          }}
          initialProducts={initialProducts}
          products={products ?? []}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
