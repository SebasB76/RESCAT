import { BoxForm } from "@/components/boxForm"
import { createBox, type BoxInput } from "@/actions/boxes"

export default function NewBoxPage() {
  async function onSubmit(input: BoxInput) {
    "use server"
    await createBox(input)
  }
  return (
    <div>
      <h1 className="font-display text-2xl text-pino">Nueva caja</h1>
      <div className="mt-6">
        <BoxForm
          initial={{ title: "", description: "", items: "", category: "", originalPrice: "", price: "", stockQty: "", bestBefore: "", pickupStart: "", pickupEnd: "", photoUrl: null }}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  )
}
