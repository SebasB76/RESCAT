export type DashboardKpi = {
  label: string
  value: string
  sub: string
  accent: string
  urgent?: boolean
}

export function DashboardKpis({ items }: { items: DashboardKpi[] }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl bg-white ring-1 ring-pino/12 lg:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="border-b border-l border-pino/10 p-4 odd:border-l-0 last:col-span-2 last:border-b-0 lg:col-span-1 lg:border-b-0 lg:border-l lg:first:border-l-0 lg:last:col-span-1">
          <dt className="text-sm font-medium text-pino/72">{item.label}</dt>
          <dd className={`mt-2 text-2xl font-black tracking-[-0.035em] tabular-nums ${item.urgent ? "text-terracota" : "text-pino"}`}>{item.value}</dd>
          <p className="mt-1 text-xs leading-5 text-pino/70">{item.sub}</p>
        </div>
      ))}
    </dl>
  )
}
