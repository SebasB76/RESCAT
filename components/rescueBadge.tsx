import { Leaf } from "lucide-react"

export function RescueBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-hoja backdrop-blur-sm ${className}`}>
      <Leaf className="size-3" /> Rescatado
    </span>
  )
}
