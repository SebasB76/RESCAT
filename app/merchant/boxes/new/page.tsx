import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"
import { BoxForm } from "@/components/boxForm"
import { createBox, type BoxInput } from "@/actions/boxes"

export default function NewBoxPage() {
  async function onSubmit(input: BoxInput) {
    "use server"
    await createBox(input)
  }
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/merchant/boxes" className="inline-flex items-center gap-1.5 text-sm font-medium text-hoja transition-colors hover:text-pino">
        <ArrowLeftIcon className="size-4" />
        Mis cajas
      </Link>
      <h1 className="mt-3 font-display text-3xl text-pino">Nueva caja</h1>
      <p className="mt-1 text-sm text-pino/60">Publica una caja sorpresa con los productos que quieres rescatar.</p>
      <div className="mt-6">
        <BoxForm
          initial={{ title: "", description: "", items: "", category: "", originalPrice: "", price: "", stockQty: "", bestBefore: "", pickupStart: "", pickupEnd: "", photoUrl: null }}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
