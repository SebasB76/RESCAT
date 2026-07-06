export function UrgencyChip({ bestBefore }: { bestBefore: string | null }) {
  if (!bestBefore) return null
  const days = Math.ceil((new Date(bestBefore).getTime() - Date.now()) / 86400000)
  const urgent = days <= 2
  const label = days <= 1 ? "¡Hoy!" : `${days} días`
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${urgent ? "bg-terracota text-white" : "bg-dorado/20 text-pino"}`}>
      Consumir antes de · {label}
    </span>
  )
}
