"use client"

import { useEffect } from "react"
import Link from "next/link"
import { ArrowRightIcon, LockKeyholeIcon, XIcon } from "lucide-react"

export function AuthPrompt({
  next,
  title = "Entra para guardar tu rescate",
  description = "Necesitamos una cuenta para proteger tu reserva y mostrarte el código de retiro.",
}: {
  next: string
  title?: string
  description?: string
}) {
  const encodedNext = encodeURIComponent(next)

  return (
    <section className="rounded-xl bg-pino p-5 text-white sm:p-6" aria-labelledby="auth-prompt-title">
      <div className="flex size-10 items-center justify-center rounded-lg bg-dorado text-pino">
        <LockKeyholeIcon className="size-5" aria-hidden="true" />
      </div>
      <h3 id="auth-prompt-title" className="mt-4 text-xl font-bold tracking-[-0.02em] text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/78">{description}</p>
      <p className="mt-3 text-xs font-semibold text-dorado">Tu selección se mantiene mientras entras.</p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link href={`/login?next=${encodedNext}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-transparent bg-dorado px-4 text-sm font-semibold text-pino transition-colors duration-150 hover:bg-white active:translate-y-px">
          Entrar
          <ArrowRightIcon className="size-4" aria-hidden="true" />
        </Link>
        <Link href={`/signup?next=${encodedNext}`} className="inline-flex h-11 items-center justify-center rounded-lg border border-white/35 bg-transparent px-4 text-sm font-semibold text-white transition-colors duration-150 hover:border-white hover:bg-white hover:text-pino active:translate-y-px">
          Crear cuenta
        </Link>
      </div>
    </section>
  )
}

export function AuthPromptDialog({ open, onClose, next, title, description }: {
  open: boolean
  onClose: () => void
  next: string
  title: string
  description: string
}) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 flex items-center justify-center bg-pino/55 p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Cerrar" autoFocus className="absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-lg bg-white text-pino transition-colors hover:bg-dorado">
          <XIcon className="size-4" />
        </button>
        <AuthPrompt next={next} title={title} description={description} />
      </div>
    </div>
  )
}
