export type AlertRow = {
  id: string
  productName: string
  brand: string | null
  storeName: string
  days: number
  qty: number
  rescatPrice: string
}

export function DashboardAlerts({ rows }: { rows: AlertRow[] }) {
  if (!rows.length) return <p className="p-5 text-sm text-pino/72">Sin lotes críticos. Todo bajo control.</p>
  return (
    <div className="overflow-x-auto">
      <table className="data-table w-full min-w-[44rem] text-sm">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Marca</th>
            <th>Tienda</th>
            <th className="text-right!">Vence</th>
            <th className="text-right!">Unid.</th>
            <th className="text-right!">Precio rescate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-pino/10">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="font-semibold text-pino">{r.productName}</td>
              <td className="text-pino/72">{r.brand ?? "—"}</td>
              <td className="text-pino/72">{r.storeName}</td>
              <td className="text-right font-bold tabular-nums text-terracota">{r.days}d</td>
              <td className="text-right tabular-nums text-pino">{r.qty}</td>
              <td className="text-right font-medium tabular-nums text-pino">{r.rescatPrice}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
