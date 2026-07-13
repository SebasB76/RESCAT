"use client"

import { Suspense, useEffect, useState, type FormEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import Image from "next/image"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, Loader2Icon, MailCheckIcon, StoreIcon, UploadIcon, UserRoundIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { createBrowserClient } from "@/lib/supabase/client"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AuthFrame } from "@/components/authFrame"

const StoreLocationPicker = dynamic(() => import("@/components/storeLocationPicker"), { ssr: false })
const GYE = { lat: -2.1709, lng: -79.9224 }
const weekDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]
const merchantSteps = ["Cuenta", "Tienda", "Retiro", "Ubicación"]
const merchantDraftKey = "rescat_merchant_draft"

type Role = "customer" | "merchant"
type MerchantDraft = {
  phone: string
  storeName: string
  address: string
  neighborhood: string
  pickupInfo: string
  pickupDays: string[]
  storeLocation: typeof GYE
}

function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/"
}

function SignupContent() {
  const supabase = createBrowserClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get("next"))
  const resumeMerchant = searchParams.get("resume") === "merchant"
  const [role, setRole] = useState<Role>("customer")
  const [merchantStep, setMerchantStep] = useState(0)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [phone, setPhone] = useState("")
  const [storeName, setStoreName] = useState("")
  const [address, setAddress] = useState("")
  const [neighborhood, setNeighborhood] = useState("")
  const [pickupInfo, setPickupInfo] = useState("")
  const [pickupDays, setPickupDays] = useState<string[]>(["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"])
  const [storeLocation, setStoreLocation] = useState(GYE)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  useEffect(() => {
    if (!resumeMerchant) return
    const stored = window.localStorage.getItem(merchantDraftKey)
    if (!stored) return
    const timeout = window.setTimeout(() => {
      try {
        const draft = JSON.parse(stored) as MerchantDraft
        setRole("merchant")
        setMerchantStep(merchantSteps.length - 1)
        setPhone(draft.phone)
        setStoreName(draft.storeName)
        setAddress(draft.address)
        setNeighborhood(draft.neighborhood)
        setPickupInfo(draft.pickupInfo)
        setPickupDays(draft.pickupDays)
        setStoreLocation(draft.storeLocation)
      } catch {
        window.localStorage.removeItem(merchantDraftKey)
      }
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [resumeMerchant])

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } })
  }

  function selectLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function validateMerchantStep(step: number) {
    if (step === 0 && !resumeMerchant && (!fullName.trim() || !email.includes("@") || password.length < 6)) {
      toast.error("Completa tu nombre, un correo válido y una contraseña de al menos 6 caracteres")
      return false
    }
    if (step === 1 && (!storeName.trim() || !address.trim())) {
      toast.error("Completa el nombre y la dirección de tu tienda")
      return false
    }
    if (step === 2 && pickupDays.length === 0) {
      toast.error("Selecciona al menos un día de retiro")
      return false
    }
    return true
  }

  function nextMerchantStep() {
    if (!validateMerchantStep(merchantStep)) return
    setMerchantStep((current) => Math.min(merchantSteps.length - 1, current + 1))
  }

  function toggleDay(day: string) {
    setPickupDays((current) => current.includes(day) ? current.filter((item) => item !== day) : [...current, day])
  }

  function merchantDraft(): MerchantDraft {
    return { phone: phone.trim(), storeName: storeName.trim(), address: address.trim(), neighborhood: neighborhood.trim(), pickupInfo: pickupInfo.trim(), pickupDays, storeLocation }
  }

  async function activateMerchant(userId: string, draft: MerchantDraft) {
    if (draft.phone) await supabase.from("profile").update({ phone: draft.phone }).eq("id", userId)

    const { data: existingStores } = await supabase.from("store").select("id").eq("ownerId", userId).limit(1)
    if (!existingStores?.length) {
      let logoUrl: string | null = null
      if (logoFile) {
        setUploading(true)
        const path = `stores/${userId}-${Date.now()}-${logoFile.name}`
        const { error: uploadError } = await supabase.storage.from("box-photos").upload(path, logoFile, { upsert: true })
        setUploading(false)
        if (uploadError) toast.error("La tienda se activará sin logo; podrás agregarlo más tarde")
        else logoUrl = supabase.storage.from("box-photos").getPublicUrl(path).data.publicUrl
      }
      const schedule = `Días habituales de retiro: ${draft.pickupDays.join(", ")}.`
      const instructions = [schedule, draft.pickupInfo].filter(Boolean).join(" ")
      const { error: registerError } = await supabase.rpc("register_merchant", {
        p_store_name: draft.storeName,
        p_address: draft.address,
        p_neighborhood: draft.neighborhood || null,
        p_lat: draft.storeLocation.lat,
        p_lng: draft.storeLocation.lng,
        p_photo_url: logoUrl,
        p_pickup_info: instructions || null,
      })
      if (registerError) {
        setBusy(false)
        toast.error("No se pudo registrar la tienda")
        return
      }
    }

    window.localStorage.removeItem(merchantDraftKey)
    toast.success("Tu tienda ya forma parte de RESCAT")
    router.push("/merchant/boxes/new")
    router.refresh()
  }

  async function continueAfterConfirmation() {
    setBusy(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) {
      setBusy(false)
      toast.error("Aún no podemos confirmar el correo. Abre el enlace recibido y vuelve a intentarlo.")
      return
    }
    await activateMerchant(data.user.id, merchantDraft())
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (role === "merchant") {
      for (let index = 0; index < merchantSteps.length; index += 1) {
        if (!validateMerchantStep(index)) {
          setMerchantStep(index)
          return
        }
      }
    }

    setBusy(true)
    if (role === "merchant") {
      const draft = merchantDraft()
      window.localStorage.setItem(merchantDraftKey, JSON.stringify(draft))
      const { data: { user: existingUser } } = await supabase.auth.getUser()
      if (existingUser) {
        await activateMerchant(existingUser.id, draft)
        return
      }
    }
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
    if (error) {
      if (role === "merchant") {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginData.user) {
          await activateMerchant(loginData.user.id, merchantDraft())
          return
        }
        if (loginError?.code === "email_not_confirmed") {
          setBusy(false)
          setAwaitingConfirmation(true)
          return
        }
      }
      setBusy(false)
      return toast.error(error.code === "over_email_send_rate_limit" ? "Supabase limitó temporalmente los correos. Espera un minuto y vuelve a intentarlo." : error.message)
    }
    if (!data.session) {
      setBusy(false)
      if (role === "merchant") {
        setAwaitingConfirmation(true)
        return
      }
      return toast.success("Cuenta creada. Revisa tu correo para confirmarla y luego entra.")
    }

    const userId = data.user!.id
    if (phone.trim()) await supabase.from("profile").update({ phone: phone.trim() }).eq("id", userId)

    if (role === "merchant") {
      await activateMerchant(userId, merchantDraft())
      return
    }

    toast.success("Cuenta creada")
    router.push(next)
    router.refresh()
  }

  return (
    <AuthFrame wide={role === "merchant"}>
      <p className="text-sm font-semibold text-hoja">Únete a la red</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.035em] text-pino">{role === "merchant" ? "Activa tu tienda" : "Crear cuenta"}</h1>
      <p className="mt-2 text-sm leading-6 text-pino/72">{role === "merchant" ? "Te acompañamos desde los datos básicos hasta tu primera caja de rescate." : "Reserva cajas cerca de ti y lleva el registro de todo lo que rescatas."}</p>

      <div className="mt-5 grid grid-cols-2 gap-2" role="group" aria-label="Tipo de cuenta">
        <button type="button" onClick={() => setRole("customer")} aria-pressed={role === "customer"} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg p-3 text-sm font-semibold transition-colors ${role === "customer" ? "bg-pino text-white" : "bg-white text-pino/65 ring-1 ring-pino/15 hover:ring-pino/30"}`}>
          <UserRoundIcon className="size-4" /> Soy Rescatista
        </button>
        <button type="button" onClick={() => setRole("merchant")} aria-pressed={role === "merchant"} className={`flex min-h-12 items-center justify-center gap-2 rounded-lg p-3 text-sm font-semibold transition-colors ${role === "merchant" ? "bg-pino text-white" : "bg-white text-pino/65 ring-1 ring-pino/15 hover:ring-pino/30"}`}>
          <StoreIcon className="size-4" /> Soy tienda
        </button>
      </div>

      {role === "merchant" && (
        <ol className="mt-5 grid grid-cols-4 gap-2" aria-label="Progreso del registro de tienda">
          {merchantSteps.map((label, index) => (
            <li key={label}>
              <button type="button" disabled={index > merchantStep} onClick={() => index < merchantStep && setMerchantStep(index)} className="w-full text-left disabled:cursor-default" aria-current={index === merchantStep ? "step" : undefined}>
                <span className={`block h-1.5 rounded-full ${index <= merchantStep ? "bg-hoja" : "bg-pino/10"}`} />
                <span className={`mt-1.5 block text-xs font-semibold ${index === merchantStep ? "text-pino" : index < merchantStep ? "text-hoja" : "text-pino/45"}`}>{label}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {role === "customer" && <Button onClick={google} className="mt-5 w-full bg-pino">Continuar con Google</Button>}

      {awaitingConfirmation ? (
        <section className="mt-6 rounded-xl bg-white p-5 ring-1 ring-pino/12" aria-labelledby="confirm-email-title">
          <div className="flex size-10 items-center justify-center rounded-lg bg-dorado/40 text-pino"><MailCheckIcon className="size-5" /></div>
          <h2 id="confirm-email-title" className="mt-4 text-xl font-bold text-pino">Confirma tu correo</h2>
          <p className="mt-2 text-sm leading-6 text-pino/72">Enviamos un enlace a <strong className="text-pino">{email}</strong>. Tu información de tienda quedó guardada en este dispositivo.</p>
          <Button type="button" onClick={continueAfterConfirmation} disabled={busy} className="mt-5 w-full bg-pino">
            {busy ? <><Loader2Icon className="size-4 animate-spin" /> Comprobando…</> : "Ya confirmé mi correo"}
          </Button>
          <p className="mt-3 text-center text-xs text-pino/60">También puedes volver más tarde e iniciar sesión; retomaremos la activación.</p>
        </section>
      ) : <form onSubmit={submit} className="mt-5">
        {(role === "customer" || merchantStep === 0) && (
          <div className="space-y-3">
            <div><Label htmlFor="fullName">Nombre {role === "merchant" ? "del encargado" : "completo"}</Label><Input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></div>
            <div><Label htmlFor="email">Correo</Label><Input id="email" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required /></div>
            <div><Label htmlFor="password">Contraseña</Label><Input id="password" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete="new-password" minLength={6} required /><p className="mt-1 text-xs text-pino/60">Mínimo 6 caracteres.</p></div>
            <div><Label htmlFor="phone">Teléfono {role === "customer" ? "(opcional)" : ""}</Label><Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="09xxxxxxxx" /></div>
          </div>
        )}

        {role === "merchant" && merchantStep === 1 && (
          <div className="space-y-4">
            <div><Label htmlFor="storeName">Nombre de la tienda</Label><Input id="storeName" value={storeName} onChange={(event) => setStoreName(event.target.value)} placeholder="Mini Market Juanita" required /></div>
            <div><Label htmlFor="address">Dirección</Label><Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Urdesa Central, Guayaquil" required /></div>
            <div><Label htmlFor="neighborhood">Barrio o sector</Label><Input id="neighborhood" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} placeholder="Urdesa" /></div>
            <div>
              <Label>Logo de la tienda (opcional)</Label>
              {logoPreview ? (
                <div className="mt-2 flex items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-pino/12">
                  <Image src={logoPreview} alt="Logo de la tienda" width={56} height={56} className="size-14 rounded-lg object-cover" unoptimized />
                  <span className="min-w-0 flex-1 text-sm font-medium text-pino">Logo listo</span>
                  <Button type="button" variant="ghost" size="icon" className="text-terracota" onClick={() => { setLogoFile(null); setLogoPreview(null) }} aria-label="Quitar logo"><XIcon className="size-4" /></Button>
                </div>
              ) : (
                <label className={`${buttonVariants({ variant: "outline" })} mt-2 h-10 cursor-pointer`}>
                  <UploadIcon className="size-4" />
                  Elegir logo
                  <input type="file" accept="image/*" className="sr-only" onChange={selectLogo} />
                </label>
              )}
            </div>
          </div>
        )}

        {role === "merchant" && merchantStep === 2 && (
          <div>
            <fieldset>
              <legend className="text-sm font-medium text-pino">¿Qué días sueles entregar cajas?</legend>
              <p className="mt-1 text-xs leading-5 text-pino/65">Esto crea una referencia para tu operación; cada caja tendrá su propia ventana exacta.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weekDays.map((day) => (
                  <button key={day} type="button" onClick={() => toggleDay(day)} aria-pressed={pickupDays.includes(day)} className={`rounded-lg px-3 py-2 text-sm font-semibold ring-1 transition-colors ${pickupDays.includes(day) ? "bg-pino text-white ring-pino" : "bg-white text-pino/65 ring-pino/15 hover:ring-pino/35"}`}>{day}</button>
                ))}
              </div>
            </fieldset>
            <div className="mt-5"><Label htmlFor="pickupInfo">Instrucciones habituales de retiro</Label><Textarea id="pickupInfo" className="mt-1.5 min-h-28" value={pickupInfo} onChange={(event) => setPickupInfo(event.target.value)} placeholder="Retiro en caja. Mostrar el código de RESCAT al encargado." /></div>
          </div>
        )}

        {role === "merchant" && merchantStep === 3 && (
          <div>
            <Label>Ubicación exacta</Label>
            <p className="mb-2 mt-1 text-xs leading-5 text-pino/65">Toca el mapa o arrastra el marcador. Esta ubicación permite ordenar las cajas por cercanía.</p>
            <StoreLocationPicker value={storeLocation} onChange={setStoreLocation} />
            <div className="mt-4 rounded-lg bg-hoja/[0.07] p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-pino"><CheckIcon className="size-4 text-hoja" /> Revisa antes de activar</p>
              <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div><dt className="text-pino/60">Tienda</dt><dd className="font-semibold text-pino">{storeName}</dd></div>
                <div><dt className="text-pino/60">Sector</dt><dd className="font-semibold text-pino">{neighborhood || address}</dd></div>
                <div className="sm:col-span-2"><dt className="text-pino/60">Días habituales</dt><dd className="font-semibold text-pino">{pickupDays.join(", ")}</dd></div>
              </dl>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          {role === "merchant" && merchantStep > 0 ? (
            <Button type="button" variant="ghost" onClick={() => setMerchantStep((current) => current - 1)} className="text-pino/70"><ArrowLeftIcon className="size-4" /> Atrás</Button>
          ) : <span />}
          {role === "merchant" && merchantStep < merchantSteps.length - 1 ? (
            <Button key={`continue-${merchantStep}`} type="button" onClick={nextMerchantStep} className="bg-pino">Continuar <ArrowRightIcon className="size-4" /></Button>
          ) : (
            <Button key="submit-account" type="submit" disabled={busy || uploading} className="bg-pino">
              {busy ? <><Loader2Icon className="size-4 animate-spin" /> Creando…</> : role === "merchant" ? "Activar tienda" : "Crear mi cuenta"}
            </Button>
          )}
        </div>
      </form>}
    </AuthFrame>
  )
}

export default function SignupPage() {
  return <Suspense><SignupContent /></Suspense>
}
