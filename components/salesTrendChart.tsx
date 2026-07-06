export type TrendPoint = { month: string; sales: number; profit: number }

const monthsEs = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

function formatMonth(m: string) {
  const [year, mm] = m.split("-")
  return `${monthsEs[Number(mm) - 1] ?? mm} ${year.slice(2)}`
}

function compactMoney(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}K` : `$${Math.round(n)}`
}

export function SalesTrendChart({ points }: { points: TrendPoint[] }) {
  if (points.length < 2) return <p className="py-8 text-center text-sm text-pino/50">Sin datos suficientes</p>

  const w = 760
  const h = 240
  const padL = 52
  const padR = 16
  const padT = 16
  const padB = 34
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const n = points.length
  const max = Math.max(...points.map((p) => Math.max(p.sales, p.profit)), 1)

  const x = (i: number) => padL + (i / (n - 1)) * innerW
  const y = (v: number) => padT + innerH - (v / max) * innerH
  const line = (key: "sales" | "profit") =>
    points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[key]).toFixed(1)}`).join(" ")

  const salesPath = line("sales")
  const areaPath = `${salesPath} L${x(n - 1).toFixed(1)},${padT + innerH} L${x(0).toFixed(1)},${padT + innerH} Z`
  const ticks = 4
  const gridLines = Array.from({ length: ticks + 1 }, (_, i) => (max / ticks) * i)
  const labelStep = Math.max(1, Math.ceil(n / 8))

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full min-w-[420px]" role="img" aria-label="Tendencia mensual de ventas y ganancia">
        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padL} y1={y(g)} x2={w - padR} y2={y(g)} stroke="#123B29" strokeOpacity={0.08} />
            <text x={padL - 8} y={y(g) + 3} textAnchor="end" fontSize={9} fill="#123B29" fillOpacity={0.45}>{compactMoney(g)}</text>
          </g>
        ))}
        <path d={areaPath} fill="#5E8A31" fillOpacity={0.12} />
        <path d={salesPath} fill="none" stroke="#5E8A31" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={line("profit")} fill="none" stroke="#E5A11C" strokeWidth={2} strokeDasharray="4 3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <text key={p.month} x={x(i)} y={h - 12} textAnchor="middle" fontSize={9} fill="#123B29" fillOpacity={0.5}>{formatMonth(p.month)}</text>
          ) : null,
        )}
      </svg>
      <div className="mt-2 flex items-center justify-center gap-4 text-xs text-pino/60">
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 rounded bg-hoja" />Ventas</span>
        <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-4 rounded bg-dorado" />Ganancia</span>
      </div>
    </div>
  )
}
