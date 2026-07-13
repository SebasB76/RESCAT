"use client"
import { useMemo, useState } from "react"
import Image from "next/image"
import { toast } from "sonner"
import { BanknoteIcon, CheckCircle2Icon, CreditCardIcon, MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon, XIcon } from "lucide-react"
import { useCart, type CartItem } from "@/components/cartProvider"
import { createOrder, type OrderResult } from "@/actions/orders"
import { type PaymentMethod } from "@/lib/payment"
import { Button } from "@/components/ui/button"
import { AuthPrompt } from "@/components/authPrompt"

type ConfirmedOrder = OrderResult & { storeName: string }

type StoreGroup = { storeId: string; storeName: string; items: CartItem[] }

export function Cart({ signedIn }: { signedIn: boolean | null }) {
  const { items, count, total, open, setOpen, removeItem, setQty, clear } = useCart()
  const [method, setMethod] = useState<PaymentMethod>("cashOnPickup")
  const [busy, setBusy] = useState(false)
  const [codes, setCodes] = useState<ConfirmedOrder[] | null>(null)
  const [authRequired, setAuthRequired] = useState(false)

  const groups = useMemo<StoreGroup[]>(() => {
    const map = new Map<string, StoreGroup>()
    for (const it of items) {
      const group: StoreGroup = map.get(it.storeId) ?? { storeId: it.storeId, storeName: it.storeName, items: [] }
      group.items.push(it)
      map.set(it.storeId, group)
    }
    return Array.from(map.values())
  }, [items])

  function close() {
    if (codes) reset()
    else {
      setAuthRequired(false)
      setOpen(false)
    }
  }

  function reset() {
    setCodes(null)
    setBusy(false)
    setMethod("cashOnPickup")
    setAuthRequired(false)
    setOpen(false)
  }

  async function checkout() {
    if (!items.length) return
    if (signedIn === false) {
      setAuthRequired(true)
      return
    }
    setBusy(true)
    const names = new Map<string, string>(items.map((i): [string, string] => [i.storeId, i.storeName]))
    try {
      const result = await createOrder({
        paymentMethod: method,
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      })
      setCodes(result.map((r) => ({ ...r, storeName: names.get(r.storeId) ?? "Tienda" })))
      clear()
    } catch (e) {
      const msg = e instanceof Error ? e.message : ""
      if (msg === "not_authenticated") {
        setAuthRequired(true)
        setBusy(false)
        return
      }
      toast.error(msg === "payment_failed" ? "El pago no se pudo procesar" : "No se pudo completar el pedido")
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir carrito"
        className="group fixed bottom-4 right-4 z-30 flex min-h-12 items-center gap-2 rounded-full bg-dorado px-4 text-pino ring-1 ring-pino/15 transition-colors hover:bg-pino hover:text-white sm:bottom-6 sm:right-6"
      >
        <ShoppingCartIcon className="size-5" />
        <span className="text-sm font-medium">Carrito</span>
        {count > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-pino text-xs font-bold text-white group-hover:bg-white group-hover:text-pino">
            {count}
          </span>
        )}
      </button>

      {open && <div className="fixed inset-0 z-40 bg-pino/45" onClick={close} aria-hidden="true" />}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={codes ? "Pedido confirmado" : "Tu carrito"}
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex min-h-16 items-center justify-between border-b border-pino/12 bg-white px-5">
          <div>
            <h2 className="text-lg font-bold text-pino">{codes ? "Pedido confirmado" : "Tu carrito"}</h2>
            {!codes && count > 0 && <p className="text-xs text-pino/72">{count} {count === 1 ? "producto" : "productos"}</p>}
          </div>
          <button type="button" onClick={close} aria-label="Cerrar" className="flex size-10 items-center justify-center rounded-lg text-pino/60 hover:bg-pino/5 hover:text-pino">
            <XIcon className="size-5" />
          </button>
        </header>

        {codes ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-hoja/12 text-hoja">
                  <CheckCircle2Icon className="size-6" />
                </div>
                <p className="mt-3 text-sm text-hoja">
                  {codes.length > 1
                    ? "Muestra cada código en su tienda al retirar."
                    : "Muestra el código en la tienda al retirar."}
                </p>
              </div>
              <div className="space-y-3">
                {codes.map((c) => (
                  <div key={c.code} className="rounded-xl bg-white p-4 ring-1 ring-pino/12">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-pino">{c.storeName}</span>
                      <span className="font-mono text-base font-bold text-pino">{c.code}</span>
                    </div>
                    <p className="mt-1 text-sm text-hoja">Total ${c.total.toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
            <footer className="border-t border-pino/10 bg-white p-4">
              <Button onClick={reset} className="w-full bg-pino">
                Listo
              </Button>
            </footer>
          </>
        ) : authRequired ? (
          <div className="flex flex-1 flex-col justify-center overflow-y-auto p-5">
            <AuthPrompt
              next="/?cart=open"
              title="Entra para completar tu pedido"
              description="Tu carrito ya está armado. Entra para generar los códigos de retiro de cada tienda."
            />
            <Button type="button" variant="ghost" onClick={() => setAuthRequired(false)} className="mt-2 w-full text-pino/70">
              Volver al carrito
            </Button>
          </div>
        ) : (
          <>
              <div className="flex-1 overflow-y-auto p-5">
              {items.length === 0 ? (
                <p className="py-16 text-center text-hoja">Tu carrito está vacío.</p>
              ) : (
                <div className="space-y-4">
                  {groups.map((group) => (
                    <div key={group.storeId}>
                      <p className="mb-2 text-xs font-semibold tracking-wide text-pino/50 uppercase">
                        {group.storeName}
                      </p>
                      <div className="space-y-2">
                        {group.items.map((it) => (
                          <div
                            key={it.productId}
                            className="flex items-center gap-3 rounded-lg bg-white p-2.5 ring-1 ring-pino/10"
                          >
                            {it.photoUrl ? (
                              <Image
                                src={it.photoUrl}
                                alt={it.name}
                                width={48}
                                height={48}
                                className="size-12 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-pino/5 text-pino/35">
                                <ShoppingCartIcon className="size-5" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-pino">{it.name}</p>
                              <p className="text-sm font-semibold text-hoja">${(it.price * it.qty).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setQty(it.productId, it.qty - 1)}
                                aria-label="Quitar uno"
                                className="flex size-6 items-center justify-center rounded-md border border-pino/20 text-pino/70 hover:border-pino hover:text-pino"
                              >
                                <MinusIcon className="size-3.5" />
                              </button>
                              <span className="w-5 text-center text-sm text-pino">{it.qty}</span>
                              <button
                                onClick={() => setQty(it.productId, it.qty + 1)}
                                aria-label="Agregar uno"
                                className="flex size-6 items-center justify-center rounded-md border border-pino/20 text-pino/70 hover:border-pino hover:text-pino"
                              >
                                <PlusIcon className="size-3.5" />
                              </button>
                            </div>
                            <button
                              onClick={() => removeItem(it.productId)}
                              aria-label="Eliminar"
                              className="text-pino/40 hover:text-pino"
                            >
                              <Trash2Icon className="size-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {groups.length > 1 && (
                    <p className="text-xs text-hoja">
                      Tu pedido se divide en {groups.length} tiendas: recibirás un código por cada una.
                    </p>
                  )}
                </div>
              )}
            </div>

            <footer className="space-y-3 border-t border-pino/10 bg-white p-4">
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Forma de pago">
                <button
                  type="button"
                  onClick={() => setMethod("cashOnPickup")}
                  aria-pressed={method === "cashOnPickup"}
                  className={`flex min-h-16 items-center justify-center gap-2 rounded-lg p-2 text-center text-sm font-semibold transition-colors ${
                    method === "cashOnPickup" ? "bg-pino text-white" : "bg-pino/5 text-pino/65 hover:bg-pino/10"
                  }`}
                >
                  <BanknoteIcon className="size-5" /> Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMethod("cardMock")}
                  aria-pressed={method === "cardMock"}
                  className={`flex min-h-16 items-center justify-center gap-2 rounded-lg p-2 text-center text-sm font-semibold transition-colors ${
                    method === "cardMock" ? "bg-pino text-white" : "bg-pino/5 text-pino/65 hover:bg-pino/10"
                  }`}
                >
                  <CreditCardIcon className="size-5" /> Tarjeta
                </button>
              </div>
              <div className="flex items-center justify-between text-base font-semibold text-pino">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Button onClick={checkout} disabled={busy || items.length === 0} size="lg" className="w-full bg-pino">
                {busy ? "Procesando…" : "Confirmar pedido"}
              </Button>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
