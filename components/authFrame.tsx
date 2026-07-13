import type { ReactNode } from "react"
import { CheckIcon } from "lucide-react"
import { BrandMark } from "@/components/brandMark"

const reasons = ["Reserva sin pago anticipado", "Retiro directo en la tienda", "Ahorro local con impacto medible"]

export function AuthFrame({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="grid min-h-dvh bg-white lg:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.2fr)]">
      <aside className="hidden bg-pino p-10 text-white lg:flex lg:flex-col xl:p-14">
        <BrandMark onDark />
        <div className="my-auto max-w-md">
          <p className="text-4xl font-black leading-[1.05] tracking-[-0.04em]">Lo que una tienda no vende hoy, alguien puede rescatarlo.</p>
          <ul className="mt-8 space-y-4">
            {reasons.map((reason) => <li key={reason} className="flex items-center gap-3 text-sm text-white/78"><CheckIcon className="size-4 text-dorado" />{reason}</li>)}
          </ul>
        </div>
        <p className="text-xs text-white/70">Guayaquil · Ecuador</p>
      </aside>
      <main className="flex min-w-0 flex-col bg-cream p-5 sm:p-8 lg:p-12">
        <BrandMark className="mb-12 lg:hidden" />
        <div className={`my-auto w-full ${wide ? "max-w-xl" : "max-w-md"} lg:mx-auto`}>{children}</div>
      </main>
    </div>
  )
}
