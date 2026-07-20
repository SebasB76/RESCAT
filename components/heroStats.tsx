"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon, MapPinIcon, SearchIcon, ShoppingBasketIcon } from "lucide-react"
import type { DiscoveryBox } from "@/components/boxCard"
import { money } from "@/lib/format"
import { boxCoverFor } from "@/lib/boxCover"
import { discountPercent, reservationPricing } from "@/lib/pricing"

type HeroStatsProps = {
  boxesCount: number
  avgSavingsPct: number | null
  search: string
  onSearchChange: (value: string) => void
  denied: boolean
  featuredBoxes: DiscoveryBox[]
}

export function HeroStats({
  boxesCount,
  avgSavingsPct,
  search,
  onSearchChange,
  denied,
  featuredBoxes,
}: HeroStatsProps) {
  const [activeSlide, setActiveSlide] = useState(0)
  const slideCount = featuredBoxes.length
  const visibleSlide = slideCount > 0 ? activeSlide % slideCount : 0

  function previousSlide() {
    setActiveSlide((current) => (current - 1 + slideCount) % slideCount)
  }

  function nextSlide() {
    setActiveSlide((current) => (current + 1) % slideCount)
  }

  return (
    <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden bg-pino text-white">
      <div className="product-shell grid lg:grid-cols-[minmax(0,1.05fr)_minmax(27rem,0.95fr)] lg:items-stretch lg:gap-14">
        <div className="flex flex-col justify-center py-10 sm:py-12 lg:min-h-[32rem] lg:py-14">
          <p className="flex items-center gap-2 text-sm font-semibold text-dorado">
            <MapPinIcon className="size-4" aria-hidden="true" />
            {boxesCount > 0
              ? `${boxesCount} ${boxesCount === 1 ? "caja disponible" : "cajas disponibles"} ahora en Guayaquil`
              : "Actualizando disponibilidad en Guayaquil"}
          </p>

          <h1 className="mt-5 max-w-[12ch] text-5xl font-black leading-[0.94] tracking-[-0.04em] text-white sm:text-6xl lg:text-[4.6rem]">
            Cajas sorpresa con comida buena. A precio de rescate.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/78 sm:text-lg">
            Cada caja reúne productos de una tienda local a un precio especial. Reserva la tuya, recógela y paga al retirar.
          </p>

          <div className="relative mt-7 max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 z-10 size-5 -translate-y-1/2 text-pino/60" aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Busca una caja o tienda"
              aria-label="Buscar cajas o tiendas"
              className="h-14 w-full rounded-xl border-0 bg-white pl-12 pr-4 text-base text-pino outline-none placeholder:text-pino/65 focus-visible:ring-2 focus-visible:ring-dorado"
            />
          </div>

          {denied && (
            <p className="mt-2 max-w-xl text-xs leading-5 text-white/72">
              Mostramos el centro de Guayaquil. Activa tu ubicación para ordenar por distancia real.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <a href="#cajas" className="inline-flex h-11 items-center gap-2 rounded-lg bg-dorado px-5 text-sm font-black text-pino transition-colors hover:bg-white">
              Rescatar una caja
              <ArrowRightIcon className="size-4" aria-hidden="true" />
            </a>
            {avgSavingsPct !== null && <span className="text-sm font-semibold text-white/78">Ahorro promedio por caja: <strong className="text-dorado">{avgSavingsPct}%</strong></span>}
          </div>
        </div>

        <div
          className="relative min-h-[23rem] overflow-hidden bg-white/8 sm:min-h-[28rem] lg:my-8 lg:min-h-0 lg:rounded-xl"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Cajas destacadas"
        >
          {slideCount > 0 ? (
            <>
              <div
                className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{ transform: `translateX(-${visibleSlide * 100}%)` }}
              >
                {featuredBoxes.map((box, index) => {
                  const pricing = reservationPricing(box.price)
                  const discount = discountPercent(box.originalPrice, pricing.total)
                  const cover = boxCoverFor(box)
                  return (
                    <article
                      key={box.id}
                      className="relative min-h-[23rem] min-w-full sm:min-h-[28rem]"
                      aria-roledescription="diapositiva"
                      aria-label={`${index + 1} de ${slideCount}`}
                      aria-hidden={index !== visibleSlide}
                    >
                      <Image
                        src={cover}
                        alt={`${box.title}, disponible en ${box.storeName}`}
                        fill
                        priority={index === 0}
                        sizes="(min-width: 1024px) 46vw, 100vw"
                        className="object-cover"
                      />

                      <div className="absolute inset-x-0 bottom-0 bg-dorado p-5 text-pino sm:flex sm:items-end sm:justify-between sm:gap-6 lg:p-6">
                        <div className="min-w-0">
                          <p className="text-sm font-bold">Disponible en {box.storeName}</p>
                          <h2 className="mt-1 line-clamp-2 text-2xl font-black leading-tight">{box.title}</h2>
                          <p className="mt-2 text-sm font-medium">Quedan {box.stockQty} · {discount > 0 ? `${discount}% menos` : "disponible hoy"}</p>
                        </div>
                        <div className="mt-4 flex shrink-0 items-end justify-between gap-5 sm:mt-0 sm:block sm:text-right">
                          <div>
                            {box.originalPrice > pricing.total && <p className="text-sm font-medium line-through opacity-65">{money(box.originalPrice)}</p>}
                            <p className="text-3xl font-black leading-none tracking-[-0.03em]">{money(pricing.total)}</p>
                            <p className="mt-1 text-xs font-semibold opacity-75">Total · comisión incluida</p>
                          </div>
                          <Link
                            href={`/?box=${box.id}`}
                            scroll={false}
                            tabIndex={index === visibleSlide ? 0 : -1}
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-black underline decoration-2 underline-offset-4 hover:no-underline"
                          >
                            Ver caja <ArrowRightIcon className="size-4" aria-hidden="true" />
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>

              {slideCount > 1 && (
                <>
                  <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-lg bg-pino/90 px-3 py-2" aria-label={`Diapositiva ${visibleSlide + 1} de ${slideCount}`}>
                    {featuredBoxes.map((box, index) => (
                      <button
                        key={box.id}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        className={`size-2 rounded-full transition-colors ${index === visibleSlide ? "bg-dorado" : "bg-white/45 hover:bg-white"}`}
                        aria-label={`Mostrar rescate ${index + 1}: ${box.title}`}
                        aria-current={index === visibleSlide ? "true" : undefined}
                      />
                    ))}
                  </div>
                  <div className="absolute right-4 top-4 flex gap-2">
                    <button type="button" onClick={previousSlide} className="flex size-10 items-center justify-center rounded-lg bg-white text-pino transition-colors hover:bg-dorado" aria-label="Rescate anterior">
                      <ChevronLeftIcon className="size-5" aria-hidden="true" />
                    </button>
                    <button type="button" onClick={nextSlide} className="flex size-10 items-center justify-center rounded-lg bg-white text-pino transition-colors hover:bg-dorado" aria-label="Siguiente rescate">
                      <ChevronRightIcon className="size-5" aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex h-full min-h-[23rem] items-center justify-center text-white/35">
              <ShoppingBasketIcon className="size-12" aria-hidden="true" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
