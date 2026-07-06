"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function SignupPage() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } })
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) return toast.error(error.message)
    toast.success("Cuenta creada")
    router.push("/")
    router.refresh()
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl sm:text-4xl text-pino">Crear cuenta</h1>
      <Button onClick={google} className="mt-6 w-full bg-pino">Continuar con Google</Button>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <div><Label>Nombre</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
        <div><Label>Correo</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></div>
        <div><Label>Contraseña</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></div>
        <Button type="submit" variant="outline" className="w-full">Registrarme</Button>
      </form>
    </main>
  )
}
