function distanceLabel(distanceKm: number) {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`
}

export function ProvenanceChip({
  storeName,
  distanceKm,
  className = "",
}: {
  storeName: string
  distanceKm?: number | null
  className?: string
}) {
  const initial = storeName.trim().charAt(0).toUpperCase() || "?"
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-pino text-xs font-bold text-cream">
        {initial}
      </span>
      <span className="truncate text-sm text-hoja">
        {storeName}
        {typeof distanceKm === "number" ? ` · a ${distanceLabel(distanceKm)} de ti` : ""}
      </span>
    </div>
  )
}
