"use client"
import type { ReactNode } from "react"
import { ListIcon, MapIcon, NavigationIcon, StarIcon } from "lucide-react"
import { TIPO_LABEL, type BoxTipo } from "@/components/boxCard"

export type SortMode = "distance" | "rating"
export type ViewMode = "list" | "map"
export type TipoFilter = "todos" | BoxTipo
type StoreOption = { id: string; name: string }
type Props = { stores: StoreOption[]; storeId: string; onStoreChange: (v: string) => void; tipo: TipoFilter; onTipoChange: (v: TipoFilter) => void; sort: SortMode; onSortChange: (v: SortMode) => void; view: ViewMode; onViewChange: (v: ViewMode) => void; resultCount: number }

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`shrink-0 rounded-full px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-pino text-white" : "bg-white text-pino/72 ring-1 ring-pino/15 hover:ring-pino/30"}`}>{children}</button>
}

function Toggle<T extends string>({ options, value, onChange }: { options: { value: T; label: string; icon: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return <div className="inline-flex rounded-lg bg-pino/[0.055] p-1" role="group">{options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${value === option.value ? "bg-white text-pino ring-1 ring-pino/10" : "text-pino/72 hover:text-pino"}`}>{option.icon}{option.label}</button>)}</div>
}

const TIPOS: TipoFilter[] = ["todos", "solo", "duo", "familia"]

export function DiscoveryFilters({ stores, storeId, onStoreChange, tipo, onTipoChange, sort, onSortChange, view, onViewChange, resultCount }: Props) {
  return (
    <div className="border-b border-pino/12 pb-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-3"><span className="w-14 shrink-0 text-sm font-medium text-pino/72">Tienda</span><div className="flex min-w-0 gap-2 overflow-x-auto pb-1"><FilterButton active={storeId === "todas"} onClick={() => onStoreChange("todas")}>Todas</FilterButton>{stores.map((store) => <FilterButton key={store.id} active={storeId === store.id} onClick={() => onStoreChange(store.id)}>{store.name}</FilterButton>)}</div></div>
          <div className="flex items-center gap-3"><span className="w-14 shrink-0 text-sm font-medium text-pino/72">Tamaño</span><div className="flex min-w-0 gap-2 overflow-x-auto pb-1">{TIPOS.map((value) => <FilterButton key={value} active={tipo === value} onClick={() => onTipoChange(value)}>{value === "todos" ? "Todos" : TIPO_LABEL[value]}</FilterButton>)}</div></div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-start xl:justify-end">
          <span className="mr-auto text-sm font-semibold text-pino xl:mr-2">{resultCount} {resultCount === 1 ? "caja" : "cajas"}</span>
          <Toggle options={[{ value: "distance", label: "Cercanía", icon: <NavigationIcon className="size-3.5" /> }, { value: "rating", label: "Valoración", icon: <StarIcon className="size-3.5" /> }]} value={sort} onChange={onSortChange} />
          <Toggle options={[{ value: "list", label: "Lista", icon: <ListIcon className="size-3.5" /> }, { value: "map", label: "Mapa", icon: <MapIcon className="size-3.5" /> }]} value={view} onChange={onViewChange} />
        </div>
      </div>
    </div>
  )
}
