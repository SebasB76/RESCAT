"use client"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

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
    <div className="flex items-center gap-0.5 rounded-lg border border-pino/15 bg-cream p-0.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => set(o.id)}
          className={`rounded-md px-2.5 py-1 text-xs transition ${current === o.id ? "bg-pino text-cream" : "text-pino/70 hover:text-pino"}`}
        >
          {o.name}
        </button>
      ))}
    </div>
  )
}

export function StoreSwitcher({ stores }: { stores: StoreOption[] }) {
  return (
    <Suspense fallback={null}>
      <Switcher stores={stores} />
    </Suspense>
  )
}
