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
    <div className="flex items-center gap-0.5 rounded-lg border border-cream/10 bg-black/15 p-1">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => set(o.id)}
          className={`flex-1 cursor-pointer truncate rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-150 ${current === o.id ? "bg-cream text-pino shadow-sm" : "text-cream/60 hover:bg-cream/10 hover:text-cream"}`}
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
