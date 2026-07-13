"use client"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import Link from "next/link"
import { AuthFrame } from "@/components/authFrame"

function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/"
}

function LoginForm() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const next = safeNext(useSearchParams().get("next"))
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${next}` } })
  }
  async function emailLogin(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return toast.error("Correo o contraseña incorrectos")
    router.push(next)
    router.refresh()
  }

  return (
    <AuthFrame>
      <p className="text-sm font-semibold text-hoja">Qué bueno verte de nuevo</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-pino">Entra a RESCAT</h1>
      <p className="mt-2 text-sm leading-6 text-pino/72">Revisa tus pedidos o gestiona el inventario de tu tienda.</p>
      <Button onClick={google} size="lg" className="mt-7 w-full bg-pino">Continuar con Google</Button>
      <div className="my-5 flex items-center gap-3 text-xs text-pino/70"><span className="h-px flex-1 bg-pino/12" />o usa tu correo<span className="h-px flex-1 bg-pino/12" /></div>
      <form onSubmit={emailLogin} className="space-y-4">
        <div><Label>Correo</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" required /></div>
        <div><Label>Contraseña</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="current-password" required /></div>
        <Button type="submit" variant="outline" size="lg" className="w-full">Entrar con correo</Button>
      </form>
      <p className="mt-7 text-center text-sm text-pino/72">¿Primera vez? <Link href="/signup" className="font-semibold text-hoja hover:text-pino">Crea tu cuenta</Link></p>
    </AuthFrame>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
