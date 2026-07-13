"use client"

import { useMemo, useState } from "react"

export type BasketRule = {
  id: string
  a: string
  b: string
  catA: string | null
  catB: string | null
  freq: number
  confAB: number
  confBA: number
  lift: number
  storeId: string | null
}

type SortKey = "a" | "b" | "freq" | "confAB" | "confBA" | "lift"
type SortDir = "asc" | "desc"

function liftClass(lift: number) {
  if (lift > 1.8) return "bg-hoja/15 text-hoja"
  if (lift >= 1.3) return "bg-dorado/15 text-dorado"
  return "bg-pino/5 text-pino/60"
}

function LiftBadge({ lift }: { lift: number }) {
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${liftClass(lift)}`}>
      {lift.toFixed(2)}
    </span>
  )
}

function SortHeader({ label, sortBy, align, active, direction, onSort }: { label: string; sortBy: SortKey; align?: "left" | "center"; active: boolean; direction: SortDir; onSort: (key: SortKey) => void }) {
  return (
    <th className={`px-3 py-2 ${align === "center" ? "text-center" : "text-left"}`}>
      <button type="button" onClick={() => onSort(sortBy)} className={`inline-flex items-center gap-1 font-medium transition ${active ? "text-pino" : "text-pino/70 hover:text-pino"}`}>
        {label}
        {active && <span className="text-[0.6rem]">{direction === "asc" ? "▲" : "▼"}</span>}
      </button>
    </th>
  )
}

export function BasketRules({ rules }: { rules: BasketRule[] }) {
  const [selected, setSelected] = useState("")
  const [search, setSearch] = useState("")
  const [sortKey, setSortKey] = useState<SortKey>("lift")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const products = useMemo(() => {
    const set = new Set<string>()
    for (const r of rules) {
      set.add(r.a)
      set.add(r.b)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"))
  }, [rules])

  const associations = useMemo(() => {
    if (!selected) return []
    return rules
      .filter((r) => r.a === selected || r.b === selected)
      .map((r) => ({
        id: r.id,
        other: r.a === selected ? r.b : r.a,
        conf: r.a === selected ? r.confAB : r.confBA,
        lift: r.lift,
        freq: r.freq,
      }))
      .sort((x, y) => y.lift - x.lift)
  }, [rules, selected])

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? rules.filter((r) => r.a.toLowerCase().includes(q) || r.b.toLowerCase().includes(q))
      : rules
    const dir = sortDir === "asc" ? 1 : -1
    return [...filtered].sort((r1, r2) => {
      if (sortKey === "a" || sortKey === "b") return r1[sortKey].localeCompare(r2[sortKey], "es") * dir
      return (r1[sortKey] - r2[sortKey]) * dir
    })
  }, [rules, search, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir(key === "a" || key === "b" ? "asc" : "desc")
    }
  }

  if (!rules.length) {
    return (
      <p className="mt-6 rounded-xl border border-pino/10 bg-white p-6 text-center text-hoja">
        Aún no hay reglas de asociación para esta selección.
      </p>
    )
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-xl border border-pino/10 bg-white p-5">
        <h2 className="font-display text-lg text-pino">Cross-selling por producto</h2>
        <p className="text-sm text-hoja">¿Qué más se compra junto con este producto?</p>

        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="mt-3 w-full rounded-lg border border-pino/15 bg-cream px-3 py-2 text-sm text-pino outline-none focus:border-hoja sm:max-w-md"
        >
          <option value="">Seleccionar producto…</option>
          {products.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <div className="mt-4">
          {!selected ? (
            <p className="text-sm text-pino/50">Selecciona un producto para ver sus mejores asociaciones.</p>
          ) : associations.length ? (
            <ul className="space-y-2">
              {associations.map((a, i) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-pino/10 px-3 py-2"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-5 shrink-0 text-sm font-bold text-pino/40">{i + 1}</span>
                    <div>
                      <p className="text-sm text-pino">
                        Se compra junto con <span className="font-medium">{a.other}</span>
                      </p>
                      <p className="text-xs text-hoja">
                        {a.freq} {a.freq === 1 ? "vez" : "veces"} · {a.conf.toFixed(1)}% de confianza
                      </p>
                    </div>
                  </div>
                  <LiftBadge lift={a.lift} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-pino/50">Sin asociaciones registradas para este producto.</p>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-pino/10 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-lg text-pino">Todas las reglas de asociación</h2>
            <p className="text-sm text-hoja">
              {rows.length} {rows.length === 1 ? "regla" : "reglas"}
            </p>
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar producto…"
            className="w-full rounded-full border border-pino/15 bg-cream px-3 py-1.5 text-sm text-pino outline-none focus:border-hoja sm:w-60"
          />
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-pino/10 text-xs uppercase tracking-wide">
                <SortHeader label="Producto A" sortBy="a" active={sortKey === "a"} direction={sortDir} onSort={toggleSort} />
                <SortHeader label="Producto B" sortBy="b" active={sortKey === "b"} direction={sortDir} onSort={toggleSort} />
                <SortHeader label="Frecuencia" sortBy="freq" align="center" active={sortKey === "freq"} direction={sortDir} onSort={toggleSort} />
                <SortHeader label="Conf. A→B" sortBy="confAB" align="center" active={sortKey === "confAB"} direction={sortDir} onSort={toggleSort} />
                <SortHeader label="Conf. B→A" sortBy="confBA" align="center" active={sortKey === "confBA"} direction={sortDir} onSort={toggleSort} />
                <SortHeader label="Lift" sortBy="lift" active={sortKey === "lift"} direction={sortDir} onSort={toggleSort} />
              </tr>
            </thead>
            <tbody>
              {rows.length ? (
                rows.map((r) => (
                  <tr key={r.id} className="border-b border-pino/5">
                    <td className="px-3 py-2 font-medium text-pino">{r.a}</td>
                    <td className="px-3 py-2 font-medium text-pino">{r.b}</td>
                    <td className="px-3 py-2 text-center text-pino/70">{r.freq}</td>
                    <td className="px-3 py-2 text-center text-pino/70">{r.confAB.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-center text-pino/70">{r.confBA.toFixed(1)}%</td>
                    <td className="px-3 py-2">
                      <LiftBadge lift={r.lift} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-hoja">
                    Sin resultados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
