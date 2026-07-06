export type DashboardKpi = {
  label: string
  value: string
  sub: string
  accent: string
  urgent?: boolean
}

export function DashboardKpis({ items }: { items: DashboardKpi[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {items.map((k) => (
        <div key={k.label} className="relative overflow-hidden rounded-xl border border-pino/10 bg-white p-4">
          <span className={`absolute inset-x-0 top-0 h-1 ${k.accent}`} />
          <p className="text-xs uppercase tracking-wide text-pino/40">{k.label}</p>
          <p className={`mt-2 font-display text-2xl ${k.urgent ? "text-terracota" : "text-pino"}`}>{k.value}</p>
          <p className="mt-0.5 text-xs text-pino/50">{k.sub}</p>
        </div>
      ))}
    </div>
  )
}
