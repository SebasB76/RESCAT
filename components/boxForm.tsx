"use client"
import { useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import type { BoxInput } from "@/actions/boxes"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export type BoxFormValues = {
  title: string; description: string; items: string; category: string
  originalPrice: string; price: string; stockQty: string
  bestBefore: string; pickupStart: string; pickupEnd: string; photoUrl: string | null
}

export function BoxForm({ initial, onSubmit }: { initial: BoxFormValues; onSubmit: (input: BoxInput) => Promise<void> }) {
  const supabase = createBrowserClient()
  const [v, setV] = useState<BoxFormValues>(initial)
  const [busy, setBusy] = useState(false)
  const set = (k: keyof BoxFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value })

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from("box-photos").upload(path, file, { upsert: true })
    if (error) return toast.error("No se pudo subir la imagen; puedes guardar sin foto")
    setV({ ...v, photoUrl: supabase.storage.from("box-photos").getPublicUrl(path).data.publicUrl })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      await onSubmit({
        title: v.title, description: v.description, category: v.category,
        items: v.items.split("\n").map((s) => s.trim()).filter(Boolean),
        originalPrice: Number(v.originalPrice), price: Number(v.price), stockQty: Number(v.stockQty),
        bestBefore: v.bestBefore, pickupStart: v.pickupStart, pickupEnd: v.pickupEnd, photoUrl: v.photoUrl,
      })
    } catch {
      toast.error("No se pudo guardar")
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-3">
      <div><Label>Título</Label><Input value={v.title} onChange={set("title")} required /></div>
      <div><Label>Descripción</Label><Textarea value={v.description} onChange={set("description")} /></div>
      <div><Label>Ítems (uno por línea)</Label><Textarea value={v.items} onChange={set("items")} /></div>
      <div><Label>Categoría</Label><Input value={v.category} onChange={set("category")} /></div>
      <div className="grid grid-cols-3 gap-3">
        <div><Label>Precio original</Label><Input value={v.originalPrice} onChange={set("originalPrice")} type="number" step="0.01" required /></div>
        <div><Label>Precio rescate</Label><Input value={v.price} onChange={set("price")} type="number" step="0.01" required /></div>
        <div><Label>Stock</Label><Input value={v.stockQty} onChange={set("stockQty")} type="number" required /></div>
      </div>
      <div><Label>Consumir antes de</Label><Input value={v.bestBefore} onChange={set("bestBefore")} type="date" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Pickup desde</Label><Input value={v.pickupStart} onChange={set("pickupStart")} type="datetime-local" required /></div>
        <div><Label>Pickup hasta</Label><Input value={v.pickupEnd} onChange={set("pickupEnd")} type="datetime-local" required /></div>
      </div>
      <div><Label>Foto</Label><Input type="file" accept="image/*" onChange={upload} /></div>
      <Button type="submit" disabled={busy} className="bg-pino">{busy ? "Guardando…" : "Guardar caja"}</Button>
    </form>
  )
}
