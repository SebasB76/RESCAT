"use client"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

function LoginForm() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const next = useSearchParams().get("next") ?? "/"
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
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-2xl text-pino">Entrar a RESCAT</h1>
      <Button onClick={google} className="mt-6 w-full bg-pino">Continuar con Google</Button>
      <div className="my-4 text-center text-sm text-hoja">o con tu correo</div>
      <form onSubmit={emailLogin} className="space-y-3">
        <div><Label>Correo</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></div>
        <div><Label>Contraseña</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></div>
        <Button type="submit" variant="outline" className="w-full">Entrar</Button>
      </form>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
