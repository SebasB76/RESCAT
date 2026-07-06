"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createBrowserClient } from "@/lib/supabase/client"
import type { BoxInput } from "@/actions/boxes"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { money } from "@/lib/format"
import { toast } from "sonner"
import { ImagePlusIcon, Loader2Icon, UploadIcon, XIcon } from "lucide-react"

export type BoxFormValues = {
  title: string; description: string; items: string; category: string
  originalPrice: string; price: string; stockQty: string
  bestBefore: string; pickupStart: string; pickupEnd: string; photoUrl: string | null
}

const categorySuggestions = ["Panadería", "Lácteos", "Frutas y verduras", "Abarrotes", "Cárnicos", "Bebidas", "Snacks", "Congelados", "Comida preparada"]

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-pino/10 bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-lg text-pino">{title}</h2>
        {desc && <p className="mt-0.5 text-xs text-pino/50">{desc}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ id, label, required, help, children }: { id: string; label: string; required?: boolean; help?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-pino">
        {label}
        {required && <span className="text-terracota" aria-hidden> *</span>}
      </Label>
      {children}
      {help && <p className="text-xs text-pino/50">{help}</p>}
    </div>
  )
}

const inputCls = "h-11"

export function BoxForm({ initial, onSubmit }: { initial: BoxFormValues; onSubmit: (input: BoxInput) => Promise<void> }) {
  const supabase = createBrowserClient()
  const [v, setV] = useState<BoxFormValues>(initial)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const set = (k: keyof BoxFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value })

  const orig = Number(v.originalPrice)
  const resc = Number(v.price)
  const hasPrices = v.originalPrice !== "" && v.price !== "" && orig > 0 && resc >= 0
  const priceError = hasPrices && resc > orig
  const discount = hasPrices && !priceError ? Math.round((1 - resc / orig) * 100) : null

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from("box-photos").upload(path, file, { upsert: true })
    setUploading(false)
    if (error) return toast.error("No se pudo subir la imagen; puedes guardar sin foto")
    setV({ ...v, photoUrl: supabase.storage.from("box-photos").getPublicUrl(path).data.publicUrl })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (priceError) return toast.error("El precio de rescate no puede superar el original")
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
    <form onSubmit={submit} className="space-y-5">
      <Section title="Detalles de la caja" desc="Lo que el cliente verá al descubrir tu caja sorpresa.">
        <Field id="title" label="Título" required>
          <Input id="title" className={inputCls} value={v.title} onChange={set("title")} placeholder="Ej. Caja sorpresa de panadería" required />
        </Field>
        <Field id="description" label="Descripción">
          <Textarea id="description" className="min-h-24" value={v.description} onChange={set("description")} placeholder="Cuenta qué suele venir y por qué vale la pena rescatarla." />
        </Field>
        <Field id="items" label="Ítems" help="Un ítem por línea. Ej. 2 panes integrales, 1 funda de galletas…">
          <Textarea id="items" className="min-h-24" value={v.items} onChange={set("items")} placeholder={"Pan integral\nGalletas\nMuffin de arándano"} />
        </Field>
        <Field id="category" label="Categoría" help="Escribe o elige una categoría.">
          <Input id="category" className={inputCls} value={v.category} onChange={set("category")} list="box-categories" placeholder="Panadería" />
          <datalist id="box-categories">
            {categorySuggestions.map((c) => <option key={c} value={c} />)}
          </datalist>
        </Field>
      </Section>

      <Section title="Precio y stock" desc="Define el ahorro que ofreces frente al precio normal.">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="originalPrice" label="Precio original" required>
            <Input id="originalPrice" className={`${inputCls} tabular-nums`} value={v.originalPrice} onChange={set("originalPrice")} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" required />
          </Field>
          <Field id="price" label="Precio rescate" required>
            <Input id="price" className={`${inputCls} tabular-nums`} value={v.price} onChange={set("price")} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" aria-invalid={priceError} required />
          </Field>
          <Field id="stockQty" label="Stock" required>
            <Input id="stockQty" className={`${inputCls} tabular-nums`} value={v.stockQty} onChange={set("stockQty")} type="number" min="0" inputMode="numeric" placeholder="0" required />
          </Field>
        </div>
        {priceError ? (
          <p className="flex items-center gap-1.5 text-sm font-medium text-terracota">El precio de rescate no puede superar el precio original.</p>
        ) : discount !== null ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center rounded-full bg-hoja/15 px-2.5 py-1 font-semibold tabular-nums text-hoja">−{discount}% de descuento</span>
            <span className="text-pino/60">El cliente ahorra <span className="font-medium tabular-nums text-pino">{money(orig - resc)}</span></span>
          </div>
        ) : null}
      </Section>

      <Section title="Disponibilidad" desc="Cuándo caduca y en qué ventana se puede retirar.">
        <Field id="bestBefore" label="Consumir antes de">
          <Input id="bestBefore" className={`${inputCls} tabular-nums`} value={v.bestBefore} onChange={set("bestBefore")} type="date" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pickupStart" label="Retiro desde" required>
            <Input id="pickupStart" className={`${inputCls} tabular-nums`} value={v.pickupStart} onChange={set("pickupStart")} type="datetime-local" required />
          </Field>
          <Field id="pickupEnd" label="Retiro hasta" required>
            <Input id="pickupEnd" className={`${inputCls} tabular-nums`} value={v.pickupEnd} onChange={set("pickupEnd")} type="datetime-local" required />
          </Field>
        </div>
      </Section>

      <Section title="Foto" desc="Una buena foto ayuda a que reserven más rápido.">
        {v.photoUrl ? (
          <div className="flex flex-wrap items-center gap-4">
            <Image src={v.photoUrl} alt="Vista previa de la caja" width={96} height={96} className="size-24 rounded-lg object-cover ring-1 ring-pino/10" unoptimized />
            <div className="flex gap-2">
              <label className={`${buttonVariants({ variant: "outline" })} h-9 cursor-pointer`}>
                <UploadIcon className="size-4" />
                Cambiar
                <input type="file" accept="image/*" className="sr-only" onChange={upload} disabled={uploading} />
              </label>
              <Button type="button" variant="ghost" className="h-9 text-terracota hover:bg-terracota/10 hover:text-terracota" onClick={() => setV({ ...v, photoUrl: null })}>
                <XIcon className="size-4" />
                Quitar
              </Button>
            </div>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pino/20 bg-cream/40 px-6 py-8 text-center transition-colors hover:border-hoja hover:bg-cream/70">
            {uploading ? <Loader2Icon className="size-6 animate-spin text-hoja" /> : <ImagePlusIcon className="size-6 text-hoja" />}
            <span className="text-sm font-medium text-pino">{uploading ? "Subiendo foto…" : "Haz clic para subir una foto"}</span>
            <span className="text-xs text-pino/50">PNG o JPG · opcional</span>
            <input type="file" accept="image/*" className="sr-only" onChange={upload} disabled={uploading} />
          </label>
        )}
      </Section>

      <div className="flex items-center justify-end gap-3 pt-1">
        <Link href="/merchant/boxes" className={`${buttonVariants({ variant: "ghost" })} h-11 px-4 text-pino/70 hover:text-pino`}>
          Cancelar
        </Link>
        <Button type="submit" disabled={busy || uploading || priceError} className="h-11 bg-pino px-6 text-cream hover:bg-pino/90">
          {busy ? <><Loader2Icon className="size-4 animate-spin" /> Guardando…</> : "Guardar caja"}
        </Button>
      </div>
    </form>
  )
}
