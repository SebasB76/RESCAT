export type CategoryBar = { label: string; ratio: number; inside: string; right: string }

const toneBg = { hoja: "bg-hoja", dorado: "bg-dorado" } as const
const toneText = { hoja: "text-cream", dorado: "text-pino" } as const

export function CategoryBars({ bars, tone = "hoja" }: { bars: CategoryBar[]; tone?: keyof typeof toneBg }) {
  if (!bars.length) return <p className="py-8 text-center text-sm text-pino/50">Sin datos suficientes</p>
  return (
    <div className="space-y-2">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-right text-xs text-pino/70 sm:w-32">{b.label}</span>
          <div className="h-5 flex-1 overflow-hidden rounded bg-cream">
            <div
              className={`flex h-full min-w-[2.5rem] items-center rounded px-2 text-[0.65rem] font-semibold whitespace-nowrap ${toneBg[tone]} ${toneText[tone]}`}
              style={{ width: `${Math.max(b.ratio * 100, 6)}%` }}
            >
              {b.inside}
            </div>
          </div>
          <span className="w-20 shrink-0 text-right text-xs tabular-nums text-pino/60">{b.right}</span>
        </div>
      ))}
    </div>
  )
}
