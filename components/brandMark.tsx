import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"

export function BrandMark({ href = "/", panel = false, onDark = false, className }: { href?: string; panel?: boolean; onDark?: boolean; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5 text-pino", className)} aria-label={panel ? "RESCAT Panel" : "RESCAT"}>
      <span className={cn("inline-flex shrink-0 items-center", onDark && "rounded-md bg-cream px-2 py-1.5")}>
        <Image src="/logo.png" alt="" width={1052} height={214} className="h-8 w-auto transition-opacity group-hover:opacity-80" />
      </span>
      {panel && <span className="border-l border-pino/20 pl-2 text-sm font-medium text-pino/70">Panel</span>}
    </Link>
  )
}
