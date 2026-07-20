"use client"

import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, ImagePlusIcon, Loader2Icon, PackageCheckIcon, UploadIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import type { BoxInput, BoxProduct } from "@/actions/boxes"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { money } from "@/lib/format"
import type { BoxTipo } from "@/components/boxCard"
import { COMMISSION_RATE, discountPercent, reservationPricing } from "@/lib/pricing"

export type BoxFormValues = {
  title: string
  description: string
  items: string
  category: string
  tipo: BoxTipo
  originalPrice: string
  price: string
  stockQty: string
  bestBefore: string
  pickupStart: string
  pickupEnd: string
  photoUrl: string | null
}

export type BoxFormProduct = { id: string; name: string; brand: string | null; price: number }

const categorySuggestions = ["Panadería", "Lácteos", "Frutas y verduras", "Abarrotes", "Cárnicos", "Bebidas", "Snacks", "Congelados", "Comida preparada"]
const steps = [
  { short: "Caja", title: "Presenta tu caja", description: "Dale una identidad clara para que el Rescatista entienda qué tipo de excedentes puede encontrar." },
  { short: "Contenido", title: "Cuenta qué puede incluir", description: "Selecciona productos reales de tu catálogo o describe manualmente el contenido esperado." },
  { short: "Precio", title: "Define el valor del rescate", description: "Haz visible el ahorro, fija cuántas cajas publicarás y revisa que el precio tenga sentido." },
  { short: "Retiro", title: "Programa y revisa", description: "Confirma la fecha, la ventana de retiro y cómo verá la publicación el cliente." },
]
const typeOptions: { value: BoxTipo; label: string; description: string }[] = [
  { value: "solo", label: "Individual", description: "Una persona" },
  { value: "duo", label: "Para dos", description: "Dos porciones" },
  { value: "familia", label: "Familiar", description: "Tres o más" },
]

function Field({ id, label, required, help, children }: { id: string; label: string; required?: boolean; help?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-pino">
        {label}
        {required && <span className="text-terracota" aria-hidden="true"> *</span>}
      </Label>
      {children}
      {help && <p className="text-xs leading-5 text-pino/65">{help}</p>}
    </div>
  )
}

function itemLabel(product: BoxFormProduct, qty: number) {
  const base = product.brand && !product.name.includes(product.brand) ? `${product.name} · ${product.brand}` : product.name
  return qty > 1 ? `${qty}× ${base}` : base
}

export function BoxForm({ initial, initialProducts = [], products, onSubmit }: {
  initial: BoxFormValues
  initialProducts?: BoxProduct[]
  products: BoxFormProduct[]
  onSubmit: (input: BoxInput) => Promise<void>
}) {
  const supabase = createBrowserClient()
  const [values, setValues] = useState<BoxFormValues>(initial)
  const [selected, setSelected] = useState<BoxProduct[]>(initialProducts)
  const [productQuery, setProductQuery] = useState("")
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const isEditing = Boolean(initial.title)

  const set = (key: keyof BoxFormValues) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((current) => ({ ...current, [key]: event.target.value }))
  }

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products])
  const filteredProducts = useMemo(() => {
    const query = productQuery.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => product.name.toLowerCase().includes(query) || (product.brand ?? "").toLowerCase().includes(query))
  }, [products, productQuery])
  const selectedValue = useMemo(
    () => selected.reduce((sum, row) => sum + (productById.get(row.productId)?.price ?? 0) * row.qty, 0),
    [selected, productById],
  )
  const manualItems = values.items.split("\n").map((item) => item.trim()).filter(Boolean)
  const originalPrice = Number(values.originalPrice)
  const rescuePrice = Number(values.price)
  const hasPrices = values.originalPrice !== "" && values.price !== "" && originalPrice > 0 && rescuePrice >= 0
  const customerPricing = reservationPricing(rescuePrice)
  const priceError = hasPrices && customerPricing.total >= originalPrice
  const discount = hasPrices && !priceError ? discountPercent(originalPrice, customerPricing.total) : null
  const recommendedPrice = originalPrice > 0 ? originalPrice * 0.5 / (1 + COMMISSION_RATE) : 0

  function toggleProduct(id: string) {
    setSelected((current) => current.some((row) => row.productId === id)
      ? current.filter((row) => row.productId !== id)
      : [...current, { productId: id, qty: 1 }])
  }

  function setQuantity(id: string, qty: number) {
    setSelected((current) => current.map((row) => row.productId === id ? { ...row, qty } : row))
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from("box-photos").upload(path, file, { upsert: true })
    setUploading(false)
    if (error) return toast.error("No se pudo subir la imagen; puedes continuar sin foto")
    setValues((current) => ({ ...current, photoUrl: supabase.storage.from("box-photos").getPublicUrl(path).data.publicUrl }))
  }

  function validate(targetStep: number) {
    if (targetStep === 0 && (!values.title.trim() || !values.category.trim())) {
      toast.error("Ponle un nombre y una categoría a la caja")
      return false
    }
    if (targetStep === 1 && selected.length === 0 && manualItems.length === 0) {
      toast.error("Selecciona al menos un producto o describe el contenido")
      return false
    }
    if (targetStep === 2) {
      if (!(originalPrice > 0) || rescuePrice < 0 || priceError) {
        toast.error("Revisa el precio original y el precio de rescate")
        return false
      }
      if (!(Number(values.stockQty) >= 1)) {
        toast.error("Publica al menos una caja")
        return false
      }
    }
    if (targetStep === 3) {
      if (!values.pickupStart || !values.pickupEnd) {
        toast.error("Define la ventana de retiro")
        return false
      }
      if (new Date(values.pickupEnd) <= new Date(values.pickupStart)) {
        toast.error("La hora final debe ser posterior al inicio del retiro")
        return false
      }
    }
    return true
  }

  function nextStep() {
    if (!validate(step)) return
    setStep((current) => Math.min(steps.length - 1, current + 1))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    for (let index = 0; index < steps.length; index += 1) {
      if (!validate(index)) {
        setStep(index)
        return
      }
    }
    const items = selected.length > 0
      ? selected.map((row) => {
        const product = productById.get(row.productId)
        return product ? itemLabel(product, row.qty) : ""
      }).filter(Boolean)
      : manualItems

    setBusy(true)
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category.trim(),
        tipo: values.tipo,
        items,
        originalPrice,
        price: rescuePrice,
        stockQty: Number(values.stockQty),
        bestBefore: values.bestBefore,
        pickupStart: values.pickupStart,
        pickupEnd: values.pickupEnd,
        photoUrl: values.photoUrl,
        products: selected,
      })
    } catch {
      toast.error("No se pudo guardar la caja")
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="overflow-hidden rounded-xl bg-white ring-1 ring-pino/12">
      <header className="border-b border-pino/10 px-5 py-5 sm:px-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-hoja">Paso {step + 1} de {steps.length}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] text-pino">{steps[step].title}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-pino/70">{steps[step].description}</p>
          </div>
          <span className="hidden rounded-lg bg-pino/[0.055] px-3 py-2 text-sm font-semibold text-pino sm:block">{Math.round(((step + 1) / steps.length) * 100)}%</span>
        </div>
        <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Progreso de publicación">
          {steps.map((item, index) => (
            <li key={item.short}>
              <button
                type="button"
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                aria-current={index === step ? "step" : undefined}
                className="w-full text-left disabled:cursor-default"
              >
                <span className={`block h-1.5 rounded-full ${index <= step ? "bg-hoja" : "bg-pino/10"}`} />
                <span className={`mt-1.5 block text-xs font-semibold ${index === step ? "text-pino" : index < step ? "text-hoja" : "text-pino/45"}`}>{item.short}</span>
              </button>
            </li>
          ))}
        </ol>
      </header>

      <div className="min-h-[30rem] px-5 py-6 sm:px-7 sm:py-7">
        {step === 0 && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="space-y-5">
              <Field id="title" label="Nombre de la caja" required help="Habla del tipo de rescate, no de un único producto.">
                <Input id="title" value={values.title} onChange={set("title")} placeholder="Ej. Caja desayuno del día" required autoFocus />
              </Field>
              <Field id="category" label="Categoría principal" required>
                <Input id="category" value={values.category} onChange={set("category")} list="box-categories" placeholder="Panadería" required />
                <datalist id="box-categories">{categorySuggestions.map((category) => <option key={category} value={category} />)}</datalist>
              </Field>
              <Field id="description" label="Qué puede esperar el cliente" help="Sé concreto, pero deja margen porque el contenido depende del excedente del día.">
                <Textarea id="description" className="min-h-28" value={values.description} onChange={set("description")} placeholder="Una selección de panes, bebidas o acompañantes disponibles al cierre." />
              </Field>
              <fieldset>
                <legend className="text-sm font-medium text-pino">Tamaño de la caja</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setValues((current) => ({ ...current, tipo: option.value }))}
                      aria-pressed={values.tipo === option.value}
                      className={`rounded-lg p-3 text-left ring-1 transition-colors ${values.tipo === option.value ? "bg-pino text-white ring-pino" : "bg-white text-pino ring-pino/15 hover:ring-pino/35"}`}
                    >
                      <span className="block text-sm font-bold">{option.label}</span>
                      <span className={`mt-0.5 block text-xs ${values.tipo === option.value ? "text-white/72" : "text-pino/60"}`}>{option.description}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>

            <div>
              <p className="text-sm font-medium text-pino">Foto de portada</p>
              <p className="mt-1 text-xs leading-5 text-pino/65">Muestra la caja completa o una composición representativa, no un solo producto aislado.</p>
              {values.photoUrl ? (
                <div className="mt-3 overflow-hidden rounded-xl bg-pino/[0.04] ring-1 ring-pino/12">
                  <div className="relative aspect-[4/3]"><Image src={values.photoUrl} alt="Vista previa de la caja" fill sizes="304px" className="object-cover" unoptimized /></div>
                  <div className="flex gap-2 p-3">
                    <label className={`${buttonVariants({ variant: "outline" })} h-9 flex-1 cursor-pointer`}>
                      <UploadIcon className="size-4" /> Cambiar
                      <input type="file" accept="image/*" className="sr-only" onChange={upload} disabled={uploading} />
                    </label>
                    <Button type="button" variant="ghost" size="icon" className="size-9 text-terracota" onClick={() => setValues((current) => ({ ...current, photoUrl: null }))} aria-label="Quitar foto"><XIcon className="size-4" /></Button>
                  </div>
                </div>
              ) : (
                <label className="mt-3 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-pino/20 bg-pino/[0.025] p-5 text-center transition-colors hover:border-hoja hover:bg-hoja/[0.035]">
                  {uploading ? <Loader2Icon className="size-7 animate-spin text-hoja" /> : <ImagePlusIcon className="size-7 text-hoja" />}
                  <span className="text-sm font-semibold text-pino">{uploading ? "Subiendo…" : "Subir foto de la caja"}</span>
                  <span className="text-xs text-pino/60">JPG o PNG · opcional</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={upload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <Input value={productQuery} onChange={(event) => setProductQuery(event.target.value)} placeholder="Buscar en tu catálogo" aria-label="Buscar producto del catálogo" />
              <div className="mt-3 max-h-[25rem] divide-y divide-pino/8 overflow-y-auto rounded-xl ring-1 ring-pino/12">
                {filteredProducts.map((product) => {
                  const current = selected.find((row) => row.productId === product.id)
                  return (
                    <div key={product.id} className={`flex items-center gap-3 p-3 ${current ? "bg-hoja/[0.055]" : "bg-white"}`}>
                      <input type="checkbox" id={`product-${product.id}`} checked={Boolean(current)} onChange={() => toggleProduct(product.id)} className="size-4 accent-hoja" />
                      <label htmlFor={`product-${product.id}`} className="min-w-0 flex-1 cursor-pointer">
                        <span className="block truncate text-sm font-medium text-pino">{product.name}</span>
                        <span className="block truncate text-xs text-pino/60">{product.brand ?? "Producto de la tienda"}</span>
                      </label>
                      <span className="text-sm font-semibold tabular-nums text-pino">{money(product.price)}</span>
                      {current && <Input type="number" min="1" value={current.qty} onChange={(event) => setQuantity(product.id, Math.max(1, Number(event.target.value) || 1))} className="h-9 w-16 text-center tabular-nums" aria-label={`Cantidad de ${product.name}`} />}
                    </div>
                  )
                })}
                {!filteredProducts.length && <p className="p-6 text-center text-sm text-pino/60">{products.length ? "Ningún producto coincide." : "Tu tienda todavía no tiene productos en el catálogo."}</p>}
              </div>
            </div>

            <aside className="space-y-5">
              <div className="rounded-xl bg-pino p-4 text-white">
                <p className="text-sm font-semibold text-dorado">Contenido seleccionado</p>
                <p className="mt-2 text-3xl font-black tabular-nums">{selected.length}</p>
                <p className="text-sm text-white/72">{selected.length === 1 ? "producto distinto" : "productos distintos"}</p>
                {selected.length > 0 && (
                  <>
                    <p className="mt-4 text-sm text-white/72">Valor estimado</p>
                    <p className="text-xl font-bold tabular-nums">{money(selectedValue)}</p>
                    <Button type="button" onClick={() => setValues((current) => ({ ...current, originalPrice: selectedValue.toFixed(2) }))} className="mt-3 w-full bg-dorado text-pino hover:bg-white">Usar este valor</Button>
                  </>
                )}
              </div>
              <Field id="items" label="O descríbelo manualmente" help="Solo se usará si no seleccionas productos. Escribe un ítem por línea.">
                <Textarea id="items" className="min-h-32" value={values.items} onChange={set("items")} placeholder={"Pan del día\nBebida\nAcompañamiento"} disabled={selected.length > 0} />
              </Field>
            </aside>
          </div>
        )}

        {step === 2 && (
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-5 sm:grid-cols-3">
              <Field id="originalPrice" label="Valor normal de la caja" required>
                <Input id="originalPrice" value={values.originalPrice} onChange={set("originalPrice")} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" className="tabular-nums" required />
              </Field>
              <Field id="price" label="Precio de rescate" required>
                <Input id="price" value={values.price} onChange={set("price")} type="number" step="0.01" min="0" inputMode="decimal" placeholder="0.00" className="tabular-nums" aria-invalid={priceError} required />
              </Field>
              <Field id="stockQty" label="Cajas disponibles" required>
                <Input id="stockQty" value={values.stockQty} onChange={set("stockQty")} type="number" min="1" inputMode="numeric" placeholder="1" className="tabular-nums" required />
              </Field>
            </div>

            <div className="mt-7 rounded-xl bg-pino p-5 text-white sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-6">
              <div>
                <p className="text-sm font-semibold text-dorado">Precio recomendado</p>
                <p className="mt-1 text-3xl font-black tabular-nums">{originalPrice > 0 ? money(recommendedPrice) : "—"}</p>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/72">Una caja al 50% comunica ahorro real y deja margen para mover el excedente a tiempo. Puedes ajustar el precio según tu operación.</p>
              </div>
              <Button type="button" disabled={!recommendedPrice} onClick={() => setValues((current) => ({ ...current, price: recommendedPrice.toFixed(2) }))} className="mt-4 bg-dorado text-pino hover:bg-white sm:mt-0">Aplicar 50%</Button>
            </div>

            {priceError ? (
              <p className="mt-4 rounded-lg bg-terracota/10 p-3 text-sm font-semibold text-terracota">El total para el cliente, incluida la comisión, debe ser menor al valor normal de la caja.</p>
            ) : discount !== null ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-hoja/[0.07] p-4">
                <div><p className="text-sm font-semibold text-pino">El cliente ahorra {money(Math.max(0, originalPrice - customerPricing.total))}</p><p className="mt-0.5 text-xs text-pino/65">Incluye la comisión RESCAT del 7% y coincide con el total que verá al reservar.</p></div>
                <span className="rounded-md bg-hoja px-3 py-1.5 text-sm font-black tabular-nums text-white">−{discount}%</span>
              </div>
            ) : null}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-5">
              <Field id="bestBefore" label="Consumir antes de" help="Ayuda a priorizar la caja y comunicar su urgencia.">
                <Input id="bestBefore" value={values.bestBefore} onChange={set("bestBefore")} type="date" className="tabular-nums" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="pickupStart" label="Retiro desde" required><Input id="pickupStart" value={values.pickupStart} onChange={set("pickupStart")} type="datetime-local" className="tabular-nums" required /></Field>
                <Field id="pickupEnd" label="Retiro hasta" required><Input id="pickupEnd" value={values.pickupEnd} onChange={set("pickupEnd")} type="datetime-local" className="tabular-nums" required /></Field>
              </div>
              <div className="rounded-lg bg-hoja/[0.07] p-4">
                <p className="flex items-center gap-2 text-sm font-bold text-pino"><PackageCheckIcon className="size-4 text-hoja" /> Lista para publicar</p>
                <p className="mt-1 text-sm leading-6 text-pino/70">Al confirmar, la caja aparecerá en el descubrimiento y el mapa mientras tenga stock y esté activa.</p>
              </div>
            </div>

            <aside aria-label="Vista previa de la caja" className="overflow-hidden rounded-xl bg-white ring-1 ring-pino/15">
              <div className="relative aspect-[4/3] bg-pino/[0.04]">
                {values.photoUrl ? <Image src={values.photoUrl} alt="Vista previa" fill sizes="320px" className="object-cover" unoptimized /> : <div className="flex h-full items-center justify-center"><ImagePlusIcon className="size-8 text-pino/20" /></div>}
                {discount !== null && <span className="absolute right-3 top-3 rounded-md bg-dorado px-2 py-1 text-xs font-black text-pino">−{discount}%</span>}
              </div>
              <div className="p-4">
                <p className="text-xs font-semibold text-hoja">{typeOptions.find((option) => option.value === values.tipo)?.label} · {values.category || "Sin categoría"}</p>
                <h3 className="mt-1 text-lg font-bold leading-tight text-pino">{values.title || "Tu caja de rescate"}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-pino/65">{values.description || selected.map((row) => productById.get(row.productId)?.name).filter(Boolean).join(" · ") || manualItems.join(" · ")}</p>
                <div className="mt-4 flex items-end justify-between border-t border-pino/10 pt-3">
                  <div><p className="text-xs tabular-nums text-pino/55 line-through">{hasPrices ? money(originalPrice) : ""}</p><p className="text-2xl font-black tabular-nums text-pino">{hasPrices ? money(customerPricing.total) : "—"}</p><p className="mt-1 text-[0.68rem] text-pino/60">Total · incluye comisión 7%</p></div>
                  <p className="text-sm font-semibold text-pino/65">{values.stockQty || "0"} cajas</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-pino/10 bg-pino/[0.02] px-5 py-4 sm:px-7">
        <div>
          {step === 0 ? (
            <Link href="/merchant/boxes" className={`${buttonVariants({ variant: "ghost" })} text-pino/70`}>Cancelar</Link>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} className="text-pino/70"><ArrowLeftIcon className="size-4" /> Atrás</Button>
          )}
        </div>
        {step < steps.length - 1 ? (
          <Button key={`continue-${step}`} type="button" onClick={nextStep} className="bg-pino px-5">Continuar <ArrowRightIcon className="size-4" /></Button>
        ) : (
          <Button key="submit-box" type="submit" disabled={busy || uploading || priceError} className="bg-hoja px-5">
            {busy ? <><Loader2Icon className="size-4 animate-spin" /> Guardando…</> : <><CheckIcon className="size-4" /> {isEditing ? "Guardar cambios" : "Publicar caja"}</>}
          </Button>
        )}
      </footer>
    </form>
  )
}
