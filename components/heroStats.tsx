import Link from "next/link"

type HeroStatsProps = {
  boxesCount: number
  productCount: number | null
  avgSavingsPct: number | null
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl leading-none text-dorado">{value}</div>
      <div className="mt-1 text-xs text-cream/60">{label}</div>
    </div>
  )
}

export function HeroStats({ boxesCount, productCount, avgSavingsPct }: HeroStatsProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-pino px-6 py-10 text-cream sm:px-10">
      <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-hoja/20 blur-3xl" />
      <div className="relative">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hoja/30 bg-hoja/15 px-3 py-1 text-xs font-medium tracking-wide text-cream/90">
          🌱 Menos desperdicio · Más ahorro
        </span>
        <h1 className="mt-4 max-w-xl font-display text-3xl leading-tight sm:text-4xl">
          Rescata comida fresca <span className="text-dorado">cerca de ti</span>
        </h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-cream/70">
          Cajas sorpresa y catálogo de abarrotes de tiendas de barrio. Productos por vencer a precio rescatado — calidad garantizada, pago al recoger.
        </p>
        <div className="mt-8 flex flex-wrap gap-8 border-t border-cream/10 pt-6">
          <Stat value={String(boxesCount)} label="Cajas disponibles" />
          <Stat value={productCount === null ? "–" : String(productCount)} label="Productos en catálogo" />
          <Stat value={avgSavingsPct === null ? "–" : `${avgSavingsPct}%`} label="Ahorro promedio" />
        </div>
        <div className="mt-6">
          <Link href="/catalogo" className="inline-flex items-center gap-1.5 rounded-full bg-dorado px-4 py-2 text-sm font-semibold text-pino transition hover:bg-dorado/90">
            Ver catálogo de abarrotes →
          </Link>
        </div>
      </div>
    </section>
  )
}
