import { ArrowDownRightIcon } from "lucide-react"

export function RescueBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-pino px-2 py-1 text-[0.7rem] font-bold text-white ${className}`}>
      <ArrowDownRightIcon className="size-3" /> Precio rescate
    </span>
  )
}
