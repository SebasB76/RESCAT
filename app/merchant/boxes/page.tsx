import Link from "next/link"
import Image from "next/image"
import { PackageIcon, PlusIcon, PackageOpenIcon } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import { buttonVariants } from "@/components/ui/button"
import { money } from "@/lib/format"

const statusMeta: Record<string, { label: string; cls: string }> = {
  active: { label: "Activa", cls: "bg-hoja/15 text-hoja" },
  soldOut: { label: "Agotada", cls: "bg-pino/10 text-pino/60" },
  expired: { label: "Expirada", cls: "bg-terracota/15 text-terracota" },
}

export default async function MerchantBoxes() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: stores } = await supabase.from("store").select("id").eq("ownerId", user!.id)
  const storeIds = (stores ?? []).map((s) => s.id)
  const { data: boxes } = await supabase.from("box").select("*")
    .in("storeId", storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"])
    .order("createdAt", { ascending: false })

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-pino">Mis cajas</h1>
          <p className="mt-1 text-sm text-pino/60">
            {boxes?.length ? `${boxes.length} ${boxes.length === 1 ? "caja publicada" : "cajas publicadas"}` : "Aún no has publicado cajas."}
          </p>
        </div>
        <Link href="/merchant/boxes/new" className={`${buttonVariants({ variant: "default" })} h-10 bg-hoja px-4 text-cream hover:bg-hoja/90`}>
          <PlusIcon className="size-4" />
          Nueva caja
        </Link>
      </div>

      {!boxes?.length ? (
        <div className="mt-8 flex flex-col items-center justify-center rounded-xl border border-dashed border-pino/20 bg-white px-6 py-16 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-cream text-hoja">
            <PackageOpenIcon className="size-7" />
          </span>
          <h2 className="mt-4 font-display text-xl text-pino">Publica tu primera caja</h2>
          <p className="mt-1 max-w-sm text-sm text-pino/60">Agrupa productos por vencer en una caja sorpresa y ponla al alcance de los Rescatistas.</p>
          <Link href="/merchant/boxes/new" className={`${buttonVariants({ variant: "default" })} mt-5 h-10 bg-hoja px-4 text-cream hover:bg-hoja/90`}>
            <PlusIcon className="size-4" />
            Crear caja
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {boxes.map((b) => {
            const status = statusMeta[b.status] ?? { label: b.status, cls: "bg-pino/10 text-pino/60" }
            const discount = b.originalPrice > 0 ? Math.round((1 - b.price / b.originalPrice) * 100) : 0
            return (
              <Link
                key={b.id}
                href={`/merchant/boxes/${b.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-pino/10 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-hoja/30"
              >
                <div className="relative h-40 w-full bg-cream">
                  {b.photoUrl ? (
                    <Image src={b.photoUrl} alt={b.title} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover" unoptimized />
                  ) : (
                    <span className="flex h-full items-center justify-center text-pino/20">
                      <PackageIcon className="size-10" />
                    </span>
                  )}
                  <span className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${status.cls}`}>
                    {status.label}
                  </span>
                  {discount > 0 && (
                    <span className="absolute right-3 top-3 inline-flex items-center rounded-full bg-dorado px-2.5 py-1 text-xs font-bold tabular-nums text-pino">
                      −{discount}%
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  {b.category && <p className="text-xs font-medium uppercase tracking-wide text-hoja">{b.category}</p>}
                  <h2 className="mt-0.5 line-clamp-1 font-display text-lg text-pino">{b.title}</h2>
                  <div className="mt-3 flex items-end justify-between border-t border-pino/5 pt-3">
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-xl tabular-nums text-pino">{money(b.price)}</span>
                      {b.originalPrice > b.price && <span className="text-sm tabular-nums text-pino/40 line-through">{money(b.originalPrice)}</span>}
                    </div>
                    <span className="text-sm tabular-nums text-pino/60">Stock {b.stockQty}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
