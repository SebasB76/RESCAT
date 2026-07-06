export type CategoryDatum = { category: string; value: number; label: string }

export function DashboardChart({ data, max }: { data: CategoryDatum[]; max: number }) {
  if (!data.length) return <p className="text-sm text-pino/50">Sin lotes en inventario.</p>
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.category}>
          <div className="mb-1 flex items-center justify-between gap-2 text-xs">
            <span className="truncate text-pino/70">{d.category}</span>
            <span className="shrink-0 font-medium tabular-nums text-pino">{d.label}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-cream">
            <div className="h-full rounded-full bg-hoja" style={{ width: `${max > 0 ? (d.value / max) * 100 : 0}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
