export type ComboRow = { id: string; a: string; b: string; freq: number; confAB: number; lift: number }

function liftClass(lift: number) {
  if (lift >= 1.8) return "bg-hoja/15 text-hoja"
  if (lift >= 1.3) return "bg-dorado/20 text-pino"
  return "bg-pino/10 text-pino/60"
}

export function DashboardCombos({ rows }: { rows: ComboRow[] }) {
  if (!rows.length) return <p className="p-5 text-sm text-pino/72">Sin combos de compra detectados.</p>
  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full min-w-[40rem] text-sm">
        <thead>
          <tr>
            <th>Producto inicial</th>
            <th>Producto asociado</th>
            <th className="text-center!">Veces</th>
            <th className="text-center!">Confianza</th>
            <th className="text-right!">Afinidad</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pino/10">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="font-semibold text-pino">{r.a}</td>
              <td className="font-semibold text-pino">{r.b}</td>
              <td className="text-center tabular-nums text-pino/70">{r.freq}×</td>
              <td className="text-center tabular-nums text-pino/70">{r.confAB}%</td>
              <td className="text-right">
                <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${liftClass(r.lift)}`}>{r.lift.toFixed(2)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
