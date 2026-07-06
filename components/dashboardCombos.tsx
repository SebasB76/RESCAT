export type ComboRow = { id: string; a: string; b: string; freq: number; confAB: number; lift: number }

function liftClass(lift: number) {
  if (lift >= 1.8) return "bg-hoja/15 text-hoja"
  if (lift >= 1.3) return "bg-dorado/20 text-pino"
  return "bg-pino/10 text-pino/60"
}

export function DashboardCombos({ rows }: { rows: ComboRow[] }) {
  if (!rows.length) return <p className="text-sm text-pino/50">Sin combos de compra detectados.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pino/10 text-left text-xs uppercase tracking-wide text-pino/40">
            <th className="pb-2 font-medium">Producto A</th>
            <th className="pb-2 font-medium">Producto B</th>
            <th className="pb-2 text-center font-medium">Frecuencia</th>
            <th className="pb-2 text-center font-medium">Conf. A→B</th>
            <th className="pb-2 text-right font-medium">Lift</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pino/10">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="py-2 pr-2 font-medium text-pino">{r.a}</td>
              <td className="py-2 pr-2 font-medium text-pino">{r.b}</td>
              <td className="py-2 text-center tabular-nums text-pino/70">{r.freq}×</td>
              <td className="py-2 text-center tabular-nums text-pino/70">{r.confAB}%</td>
              <td className="py-2 text-right">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${liftClass(r.lift)}`}>{r.lift.toFixed(2)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
