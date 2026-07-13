"use client"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { ChevronDownIcon, StoreIcon } from "lucide-react"

type StoreOption = { id: string; name: string }

function Switcher({ stores }: { stores: StoreOption[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const current = params.get("store") ?? "todas"

  function set(value: string) {
    const next = new URLSearchParams(params.toString())
    if (value === "todas") next.delete("store")
    else next.set("store", value)
    const qs = next.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const options: StoreOption[] = [{ id: "todas", name: "Ambas" }, ...stores]

  return (
    <label className="relative block">
      <span className="sr-only">Tienda activa</span>
      <StoreIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-pino/48" />
      <select value={current} onChange={(event) => set(event.target.value)} className="h-10 w-full appearance-none rounded-lg bg-white pl-9 pr-8 text-sm font-semibold text-pino ring-1 ring-pino/15 outline-none focus:ring-2 focus:ring-hoja/35">
        {options.map((option) => <option key={option.id} value={option.id}>{option.id === "todas" ? "Todas las tiendas" : option.name}</option>)}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-pino/45" />
    </label>
  )
}

export function StoreSwitcher({ stores }: { stores: StoreOption[] }) {
  return (
    <Suspense fallback={null}>
      <Switcher stores={stores} />
    </Suspense>
  )
}
