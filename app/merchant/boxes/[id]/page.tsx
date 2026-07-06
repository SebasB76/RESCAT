import { notFound } from "next/navigation"
import { BoxForm } from "@/components/boxForm"
import { updateBox, type BoxInput } from "@/actions/boxes"
import { createServerClient } from "@/lib/supabase/server"

export default async function EditBoxPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: b } = await supabase.from("box").select("*").eq("id", id).single()
  if (!b) notFound()

  async function onSubmit(input: BoxInput) {
    "use server"
    await updateBox(id, input)
  }
  return (
    <div>
      <h1 className="font-display text-2xl text-pino">Editar caja</h1>
      <div className="mt-6">
        <BoxForm
          initial={{
            title: b.title, description: b.description ?? "", items: (b.items ?? []).join("\n"),
            category: b.category ?? "", originalPrice: String(b.originalPrice), price: String(b.price),
            stockQty: String(b.stockQty), bestBefore: b.bestBefore ?? "",
            pickupStart: b.pickupStart.slice(0, 16), pickupEnd: b.pickupEnd.slice(0, 16), photoUrl: b.photoUrl,
          }}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
