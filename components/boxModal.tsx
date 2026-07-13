"use client"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { BoxReserve, type ReserveBox } from "@/components/boxReserve"

export function BoxModal({ id, signedIn }: { id: string; signedIn: boolean | null }) {
  const router = useRouter()
  const [box, setBox] = useState<ReserveBox | null>(null)
  const [missing, setMissing] = useState(false)

  const close = useCallback(() => {
    router.push("/", { scroll: false })
  }, [router])

  useEffect(() => {
    const supabase = createBrowserClient()
    let active = true
    supabase
      .from("box")
      .select("id,title,description,items,category,price,originalPrice,photoUrl,bestBefore,pickupStart,pickupEnd,stockQty,status,tipo,store(name,neighborhood,address,pickupInfo,review(rating))")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!active) return
        if (!data) {
          setMissing(true)
          return
        }
        const store = data.store as unknown as { name: string; neighborhood: string | null; address: string; pickupInfo: string | null; review: { rating: number }[] } | null
        const reviews = store?.review ?? []
        setBox({
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          items: data.items ?? [],
          price: data.price,
          originalPrice: data.originalPrice,
          photoUrl: data.photoUrl,
          bestBefore: data.bestBefore,
          pickupStart: data.pickupStart,
          pickupEnd: data.pickupEnd,
          tipo: data.tipo,
          storeName: store?.name ?? "",
          neighborhood: store?.neighborhood ?? null,
          address: store?.address ?? "",
          pickupInfo: store?.pickupInfo ?? null,
          rating: reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0,
          reviewCount: reviews.length,
          stockQty: data.stockQty,
          status: data.status,
        })
      })
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [close])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Detalle de caja"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-pino/55 p-3 sm:items-center sm:p-6"
      onClick={close}
    >
      <div className="my-auto w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {box ? (
          <BoxReserve box={box} onClose={close} signedIn={signedIn} />
        ) : missing ? (
          <div className="rounded-xl bg-white p-8 text-center text-pino">No se encontró la caja.</div>
        ) : (
          <div className="h-72 animate-pulse rounded-xl bg-white/70" />
        )}
      </div>
    </div>
  )
}
