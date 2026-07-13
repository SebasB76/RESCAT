"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export type TraceabilityRow = {
  id: string
  storeId: string
  storeName: string
  productName: string
  brand: string | null
  category: string | null
  subcategory: string | null
  receivedAt: string
  expiryDate: string
  daysToExpiry: number
  qty: number
  unitCost: number
  price: number
  totalValue: number
  level: string
  autoDiscountPct: number
  rescatPrice: number
}

const LEVEL_OPTIONS = [
  { value: "VENCIDO", label: "Vencido" },
  { value: "CRITICO", label: "Crítico (≤7d)" },
  { value: "ALERTA", label: "Alerta (8–14d)" },
  { value: "ADVERTENCIA", label: "Prevención (15–30d)" },
  { value: "OK", label: "OK" },
]

function money(n: number) {
  return `$${Number(n).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string) {
  const parts = iso.slice(0, 10).split("-")
  if (parts.length !== 3) return iso
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function levelChip(level: string) {
  switch (level) {
    case "VENCIDO":
    case "CRITICO":
      return "bg-terracota text-white"
    case "ALERTA":
      return "bg-dorado text-white"
    case "ADVERTENCIA":
      return "bg-hoja text-white"
    default:
      return "bg-pino/60 text-white"
  }
}

function levelLabel(level: string) {
  switch (level) {
    case "VENCIDO":
      return "VENCIDO"
    case "CRITICO":
      return "CRÍTICO"
    case "ALERTA":
      return "ALERTA"
    case "ADVERTENCIA":
      return "PREV."
    default:
      return "OK"
  }
}

function daysColor(level: string) {
  switch (level) {
    case "VENCIDO":
    case "CRITICO":
      return "text-terracota"
    case "ALERTA":
      return "text-dorado"
    case "ADVERTENCIA":
      return "text-hoja"
    default:
      return "text-pino/60"
  }
}

function csvField(value: string) {
  return `"${value.replace(/"/g, '""')}"`
}

export function TraceabilityTable({ rows }: { rows: TraceabilityRow[] }) {
  const [level, setLevel] = useState("")
  const [category, setCategory] = useState("")
  const [query, setQuery] = useState("")

  const categories = useMemo(() => {
    const set = new Set<string>()
    rows.forEach((r) => {
      if (r.category) set.add(r.category)
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"))
  }, [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows
      .filter((r) => (level ? r.level === level : true))
      .filter((r) => (category ? r.category === category : true))
      .filter((r) => {
        if (!q) return true
        return r.productName.toLowerCase().includes(q) || (r.brand ?? "").toLowerCase().includes(q)
      })
      .slice()
      .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
  }, [rows, level, category, query])

  function exportCsv() {
    const headers = ["Producto", "Marca", "Categoría", "Tienda", "Ingreso", "Caducidad", "Días", "Urgencia", "Qty", "Costo", "Valor", "Desc%", "Precio RESCAT"]
    const body = filtered.map((r) => [
      r.productName,
      r.brand ?? "",
      r.category ?? "",
      r.storeName,
      formatDate(r.receivedAt),
      formatDate(r.expiryDate),
      String(r.daysToExpiry),
      r.level,
      String(r.qty),
      r.unitCost.toFixed(2),
      r.totalValue.toFixed(2),
      String(r.autoDiscountPct),
      r.rescatPrice.toFixed(2),
    ])
    const csv = [headers, ...body].map((row) => row.map(csvField).join(",")).join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "rescat_trazabilidad.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  const selectClass = "h-8 rounded-lg border border-pino/15 bg-white px-2.5 text-sm text-pino outline-none focus-visible:border-hoja"

  return (
    <div className="rounded-2xl border border-pino/10 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pino/10 p-4">
        <div>
          <h2 className="font-display text-lg text-pino">Lotes en percha</h2>
          <p className="text-xs text-pino/50">{filtered.length} lotes</p>
        </div>
        <Button onClick={exportCsv} size="sm" className="bg-hoja">Exportar CSV</Button>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-pino/10 p-4">
        <select value={level} onChange={(e) => setLevel(e.target.value)} className={selectClass} aria-label="Filtrar por nivel">
          <option value="">Todos los niveles</option>
          {LEVEL_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass} aria-label="Filtrar por categoría">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar producto o marca…" className="h-8 w-56" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-pino/10 text-left text-xs uppercase tracking-wide text-pino/40">
              <th className="px-3 py-2 font-medium">Producto</th>
              <th className="px-3 py-2 font-medium">Marca</th>
              <th className="px-3 py-2 font-medium">Categoría</th>
              <th className="px-3 py-2 font-medium">Tienda</th>
              <th className="px-3 py-2 font-medium">Ingreso</th>
              <th className="px-3 py-2 font-medium">Caducidad</th>
              <th className="px-3 py-2 text-right font-medium">Días</th>
              <th className="px-3 py-2 font-medium">Urgencia</th>
              <th className="px-3 py-2 text-right font-medium">Qty</th>
              <th className="px-3 py-2 text-right font-medium">Costo</th>
              <th className="px-3 py-2 text-right font-medium">Valor</th>
              <th className="px-3 py-2 text-right font-medium">Desc%</th>
              <th className="px-3 py-2 text-right font-medium">Precio RESCAT</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b border-pino/5 last:border-0">
                <td className="px-3 py-2 font-medium text-pino">{r.productName}</td>
                <td className="px-3 py-2 text-pino/60">{r.brand ?? "—"}</td>
                <td className="px-3 py-2 text-pino/80">{r.category ?? "—"}</td>
                <td className="px-3 py-2 text-pino/60">{r.storeName}</td>
                <td className="px-3 py-2 text-pino/60">{formatDate(r.receivedAt)}</td>
                <td className="px-3 py-2 text-pino/60">{formatDate(r.expiryDate)}</td>
                <td className={`px-3 py-2 text-right font-semibold ${daysColor(r.level)}`}>{r.daysToExpiry}</td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${levelChip(r.level)}`}>{levelLabel(r.level)}</span>
                </td>
                <td className="px-3 py-2 text-right text-pino">{r.qty}</td>
                <td className="px-3 py-2 text-right text-pino/80">{money(r.unitCost)}</td>
                <td className="px-3 py-2 text-right font-medium text-pino">{money(r.totalValue)}</td>
                <td className="px-3 py-2 text-right font-semibold text-pino/80">{r.autoDiscountPct > 0 ? `-${r.autoDiscountPct}%` : "—"}</td>
                <td className="px-3 py-2 text-right font-semibold text-hoja">{r.autoDiscountPct > 0 ? money(r.rescatPrice) : "—"}</td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={13} className="px-3 py-10 text-center text-pino/40">Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
