"use client"
import { useState } from "react"

export function UrgencyChip({ bestBefore }: { bestBefore: string | null }) {
  const [now] = useState(() => Date.now())
  if (!bestBefore) return null
  const days = Math.ceil((new Date(bestBefore).getTime() - now) / 86400000)
  const urgent = days <= 2
  const label = days <= 1 ? "¡Hoy!" : `${days} días`
  return (
    <span className={`rounded-md px-2 py-1 text-xs font-semibold ${urgent ? "bg-terracota text-white" : "bg-dorado/35 text-pino"}`}>
      Consumir antes de · {label}
    </span>
  )
}
