"use client"
import type { ReactNode } from "react"
import { ChevronDownIcon, ListIcon, MapIcon, NavigationIcon, StarIcon } from "lucide-react"
import { TIPO_LABEL, type BoxTipo } from "@/components/boxCard"

export type SortMode = "distance" | "rating"
export type ViewMode = "list" | "map"
export type TipoFilter = "todos" | BoxTipo
type StoreOption = { id: string; name: string }
type Props = { stores: StoreOption[]; storeId: string; onStoreChange: (v: string) => void; tipo: TipoFilter; onTipoChange: (v: TipoFilter) => void; sort: SortMode; onSortChange: (v: SortMode) => void; view: ViewMode; onViewChange: (v: ViewMode) => void }

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${active ? "border-pino bg-pino text-white" : "border-pino/14 bg-transparent text-pino/72 hover:border-pino/30 hover:bg-pino/[0.035] hover:text-pino"}`}>{children}</button>
}

function Toggle<T extends string>({ options, value, onChange }: { options: { value: T; label: ReactNode; icon: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return <div className="inline-flex rounded-lg bg-pino/[0.055] p-1" role="group">{options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)} className={`inline-flex min-h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${value === option.value ? "bg-white text-pino ring-1 ring-pino/12" : "text-pino/65 hover:bg-white/55 hover:text-pino"}`}>{option.icon}{option.label}</button>)}</div>
}

const TIPOS: TipoFilter[] = ["todos", "solo", "duo", "familia"]

export function DiscoveryFilters({ stores, storeId, onStoreChange, tipo, onTipoChange, sort, onSortChange, view, onViewChange }: Props) {
  return (
    <div className="flex flex-col gap-3 border-y border-pino/12 py-3 xl:flex-row xl:items-center">
      <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center">
        <label className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-semibold text-pino/70">Tienda</span>
          <span className="relative">
            <select
              value={storeId}
              onChange={(event) => onStoreChange(event.target.value)}
              className="h-9 min-w-48 appearance-none rounded-lg border border-pino/14 bg-white py-0 pl-3 pr-8 text-sm font-medium text-pino outline-none transition-colors hover:border-pino/30 focus:border-hoja focus:ring-2 focus:ring-hoja/20"
            >
              <option value="todas">Todas las tiendas</option>
              {stores.map((store) => <option key={store.id} value={store.id}>{store.name}</option>)}
            </select>
            <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-pino/55" aria-hidden="true" />
          </span>
        </label>
        <span className="hidden h-8 w-px shrink-0 bg-pino/12 md:block" aria-hidden="true" />
        <div className="flex min-w-0 flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:gap-2" role="group" aria-label="Filtrar por tamaño">
          <span className="shrink-0 text-xs font-semibold text-pino/70">Tamaño</span>
          <div className="flex min-w-0 gap-1.5 overflow-x-auto py-0.5">
            {TIPOS.map((value) => <FilterButton key={value} active={tipo === value} onClick={() => onTipoChange(value)}>{value === "todos" ? "Todos" : TIPO_LABEL[value]}</FilterButton>)}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-pino/10 pt-3 sm:justify-end xl:border-l xl:border-t-0 xl:pl-3 xl:pt-0">
        <Toggle options={[
          { value: "distance", label: <><span className="sm:hidden">Cerca</span><span className="hidden sm:inline">Cercanía</span></>, icon: <NavigationIcon className="size-3.5" /> },
          { value: "rating", label: <><span className="sm:hidden">Mejor</span><span className="hidden sm:inline">Valoración</span></>, icon: <StarIcon className="size-3.5" /> },
        ]} value={sort} onChange={onSortChange} />
        <Toggle options={[{ value: "list", label: "Lista", icon: <ListIcon className="size-3.5" /> }, { value: "map", label: "Mapa", icon: <MapIcon className="size-3.5" /> }]} value={view} onChange={onViewChange} />
      </div>
    </div>
  )
}
