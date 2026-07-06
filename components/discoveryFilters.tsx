"use client"
import type { ReactNode } from "react"
import { TIPO_LABEL, type BoxTipo } from "@/components/boxCard"

export type SortMode = "distance" | "rating"
export type ViewMode = "list" | "map"
export type TipoFilter = "todos" | BoxTipo

type StoreOption = { id: string; name: string }

type DiscoveryFiltersProps = {
  stores: StoreOption[]
  storeId: string
  onStoreChange: (v: string) => void
  tipo: TipoFilter
  onTipoChange: (v: TipoFilter) => void
  sort: SortMode
  onSortChange: (v: SortMode) => void
  view: ViewMode
  onViewChange: (v: ViewMode) => void
  resultCount: number
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${active ? "border-pino bg-pino text-cream" : "border-pino/20 bg-white text-pino/70 hover:border-hoja hover:text-hoja"}`}
    >
      {children}
    </button>
  )
}

function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-pino/15 bg-cream p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-sm transition ${value === o.value ? "bg-pino text-cream" : "text-pino/70 hover:text-pino"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const TIPOS: TipoFilter[] = ["todos", "solo", "duo", "familia"]

function Label({ children }: { children: ReactNode }) {
  return <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-pino/50">{children}</p>
}

export function DiscoveryFilters({ stores, storeId, onStoreChange, tipo, onTipoChange, sort, onSortChange, view, onViewChange, resultCount }: DiscoveryFiltersProps) {
  return (
    <div className="space-y-5">
      <div>
        <Label>Tienda</Label>
        <div className="flex flex-wrap gap-2">
          <Pill active={storeId === "todas"} onClick={() => onStoreChange("todas")}>Todas</Pill>
          {stores.map((s) => (
            <Pill key={s.id} active={storeId === s.id} onClick={() => onStoreChange(s.id)}>{s.name}</Pill>
          ))}
        </div>
      </div>
      <div>
        <Label>Tipo de caja</Label>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <Pill key={t} active={tipo === t} onClick={() => onTipoChange(t)}>{t === "todos" ? "Todas" : TIPO_LABEL[t]}</Pill>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <Label>Ordenar por</Label>
            <Segmented
              options={[{ value: "distance", label: "Cercanía" }, { value: "rating", label: "Valoración" }]}
              value={sort}
              onChange={onSortChange}
            />
          </div>
          <div>
            <Label>Vista</Label>
            <Segmented
              options={[{ value: "list", label: "Lista" }, { value: "map", label: "Mapa" }]}
              value={view}
              onChange={onViewChange}
            />
          </div>
        </div>
        <p className="text-sm text-hoja">{resultCount} {resultCount === 1 ? "caja" : "cajas"}</p>
      </div>
    </div>
  )
}
