export type AlertRow = {
  id: string
  productName: string
  brand: string | null
  tienda: string
  days: number
  qty: number
  rescatPrice: string
}

export function DashboardAlerts({ rows }: { rows: AlertRow[] }) {
  if (!rows.length) return <p className="text-sm text-pino/50">Sin lotes críticos. Todo bajo control.</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-pino/10 text-left text-xs uppercase tracking-wide text-pino/40">
            <th className="pb-2 font-medium">Producto</th>
            <th className="pb-2 font-medium">Marca</th>
            <th className="pb-2 font-medium">Tienda</th>
            <th className="pb-2 text-right font-medium">Días</th>
            <th className="pb-2 text-right font-medium">Cant.</th>
            <th className="pb-2 text-right font-medium">Precio RESCAT</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pino/10">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="py-2 pr-2 font-medium text-pino">{r.productName}</td>
              <td className="py-2 pr-2 text-pino/60">{r.brand ?? "—"}</td>
              <td className="py-2 pr-2 text-pino/60">{r.tienda}</td>
              <td className="py-2 text-right font-semibold tabular-nums text-terracota">{r.days}d</td>
              <td className="py-2 text-right tabular-nums text-pino">{r.qty}</td>
              <td className="py-2 text-right tabular-nums text-pino">{r.rescatPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
