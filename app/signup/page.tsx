"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import Image from "next/image"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2Icon, UploadIcon, XIcon, StoreIcon, UserRoundIcon } from "lucide-react"

const StoreLocationPicker = dynamic(() => import("@/components/storeLocationPicker"), { ssr: false })
const GYE = { lat: -2.1709, lng: -79.9224 }

type Role = "customer" | "merchant"

export default function SignupPage() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const [role, setRole] = useState<Role>("customer")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")

  const [storeName, setStoreName] = useState("")
  const [address, setAddress] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [pickupInfo, setPickupInfo] = useState("")
  const [loc, setLoc] = useState(GYE)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } })
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = `stores/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from("box-photos").upload(path, file, { upsert: true })
    setUploading(false)
    if (error) return toast.error("No se pudo subir el logo; puedes continuar sin él")
    setLogoUrl(supabase.storage.from("box-photos").getPublicUrl(path).data.publicUrl)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (role === "merchant" && (!storeName.trim() || !address.trim())) {
      return toast.error("Completa el nombre y la dirección de tu tienda")
    }
    setBusy(true)
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) { setBusy(false); return toast.error(error.message) }
    if (!data.session) {
      setBusy(false)
      return toast.error("Revisa tu correo para confirmar la cuenta y vuelve a entrar")
    }
    const uid = data.user!.id
    if (phone.trim()) await supabase.from("profile").update({ phone: phone.trim() }).eq("id", uid)

    if (role === "merchant") {
      const { error: regError } = await supabase.rpc("register_merchant", {
        p_store_name: storeName.trim(),
        p_address: address.trim(),
        p_neighborhood: neighborhood.trim() || null,
        p_lat: loc.lat,
        p_lng: loc.lng,
        p_photo_url: logoUrl,
        p_pickup_info: pickupInfo.trim() || null,
      })
      if (regError) { setBusy(false); return toast.error("No se pudo registrar la tienda") }
      toast.success("¡Tienda registrada!")
      router.push("/merchant")
      router.refresh()
      return
    }

    toast.success("Cuenta creada")
    router.push("/")
    router.refresh()
  }

  return (
    <main className={`mx-auto px-6 py-12 ${role === "merchant" ? "max-w-xl" : "max-w-sm"}`}>
      <h1 className="font-display text-3xl sm:text-4xl text-pino">Crear cuenta</h1>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setRole("customer")}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition ${role === "customer" ? "border-hoja bg-hoja/10 text-pino" : "border-pino/15 text-pino/60 hover:border-pino/30"}`}
        >
          <UserRoundIcon className="size-4" /> Soy Rescatista
        </button>
        <button
          type="button"
          onClick={() => setRole("merchant")}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 p-3 text-sm font-medium transition ${role === "merchant" ? "border-hoja bg-hoja/10 text-pino" : "border-pino/15 text-pino/60 hover:border-pino/30"}`}
        >
          <StoreIcon className="size-4" /> Soy tienda
        </button>
      </div>

      {role === "customer" && (
        <Button onClick={google} className="mt-4 w-full bg-pino">Continuar con Google</Button>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div><Label>Nombre {role === "merchant" ? "del encargado" : ""}</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} required /></div>
        <div><Label>Correo</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></div>
        <div><Label>Contraseña</Label><Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></div>
        <div><Label>Teléfono {role === "merchant" ? "" : "(opcional)"}</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="09xxxxxxxx" /></div>

        {role === "merchant" && (
          <div className="space-y-3 rounded-xl border border-pino/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-pino/50">Datos de la tienda</p>
            <div><Label>Nombre de la tienda</Label><Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Mini Market Juanita" required /></div>
            <div><Label>Dirección</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Urdesa Central, Guayaquil" required /></div>
            <div><Label>Barrio / sector</Label><Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Urdesa" /></div>
            <div><Label>Instrucciones de retiro</Label><Textarea value={pickupInfo} onChange={(e) => setPickupInfo(e.target.value)} placeholder="Retiro en caja, mostrar código" /></div>

            <div>
              <Label>Logo (opcional)</Label>
              {logoUrl ? (
                <div className="mt-1.5 flex items-center gap-3">
                  <Image src={logoUrl} alt="Logo de la tienda" width={56} height={56} className="size-14 rounded-lg object-cover ring-1 ring-pino/10" unoptimized />
                  <Button type="button" variant="ghost" className="h-9 text-terracota hover:bg-terracota/10 hover:text-terracota" onClick={() => setLogoUrl(null)}>
                    <XIcon className="size-4" /> Quitar
                  </Button>
                </div>
              ) : (
                <label className={`${buttonVariants({ variant: "outline" })} mt-1.5 h-9 cursor-pointer`}>
                  {uploading ? <Loader2Icon className="size-4 animate-spin" /> : <UploadIcon className="size-4" />}
                  {uploading ? "Subiendo…" : "Subir logo"}
                  <input type="file" accept="image/*" className="sr-only" onChange={uploadLogo} disabled={uploading} />
                </label>
              )}
            </div>

            <div>
              <Label>Ubicación en el mapa</Label>
              <p className="mb-1.5 text-xs text-pino/50">Toca o arrastra el marcador donde está tu tienda (para que los Rescatistas cercanos te encuentren).</p>
              <StoreLocationPicker value={loc} onChange={setLoc} />
              <p className="mt-1 text-xs tabular-nums text-pino/40">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>
            </div>
          </div>
        )}

        <Button type="submit" disabled={busy || uploading} variant={role === "merchant" ? "default" : "outline"} className={`w-full ${role === "merchant" ? "bg-pino text-cream hover:bg-pino/90" : ""}`}>
          {busy ? <><Loader2Icon className="size-4 animate-spin" /> Creando…</> : role === "merchant" ? "Registrar mi tienda" : "Registrarme"}
        </Button>
      </form>
    </main>
  )
}
