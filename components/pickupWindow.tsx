import { Clock } from "lucide-react"

const TZ = "America/Guayaquil"

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("es-EC", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  })
}

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ })
}

export function PickupWindow({
  start,
  end,
  className = "",
}: {
  start?: string | null
  end: string | null
  className?: string
}) {
  if (!end) return null
  const sameDay = start ? dayKey(start) === dayKey(end) : false
  const label = sameDay && start ? `${hhmm(start)}–${hhmm(end)}` : `hasta ${hhmm(end)}`
  return (
    <span className={`inline-flex items-center gap-1 rounded-md bg-dorado/35 px-2 py-1 text-xs font-semibold text-pino ${className}`}>
      <Clock className="size-3" /> Recoge {label}
    </span>
  )
}
