"use client"
import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MinusIcon, PlusIcon, ShoppingCartIcon, Trash2Icon, XIcon } from "lucide-react"
import { useCart, type CartItem } from "@/components/cartProvider"
import { createOrder, type OrderResult } from "@/actions/orders"
import { type PaymentMethod } from "@/lib/payment"
import { Button } from "@/components/ui/button"

type ConfirmedOrder = OrderResult & { storeName: string }

type StoreGroup = { storeId: string; storeName: string; items: CartItem[] }

export function Cart() {
  const { items, count, total, open, setOpen, removeItem, setQty, clear } = useCart()
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>("cashOnPickup")
  const [busy, setBusy] = useState(false)
  const [codes, setCodes] = useState<ConfirmedOrder[] | null>(null)

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
    else setOpen(false)
  }

  function reset() {
    setCodes(null)
    setBusy(false)
    setMethod("cashOnPickup")
    setOpen(false)
  }

  async function checkout() {
    if (!items.length) return
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
        router.push("/login?next=/catalogo")
        return
      }
      toast.error(msg === "payment_failed" ? "El pago no se pudo procesar" : "No se pudo completar el pedido")
      setBusy(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Abrir carrito"
        className="fixed right-5 bottom-5 z-30 flex items-center gap-2 rounded-full bg-pino px-5 py-3 text-cream shadow-lg transition hover:bg-pino/90"
      >
        <ShoppingCartIcon className="size-5" />
        <span className="text-sm font-medium">Carrito</span>
        {count > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-dorado text-xs font-bold text-pino">
            {count}
          </span>
        )}
      </button>

      {open && <div className="fixed inset-0 z-40 bg-pino/30" onClick={close} />}

      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-cream shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-pino/10 bg-white px-4 py-3">
          <h2 className="font-display text-lg text-pino">{codes ? "Pedido confirmado" : "Tu carrito"}</h2>
          <button onClick={close} aria-label="Cerrar" className="text-pino/60 hover:text-pino">
            <XIcon className="size-5" />
          </button>
        </header>

        {codes ? (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-4 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-hoja/15 text-xl text-hoja">
                  ✓
                </div>
                <p className="mt-3 text-sm text-hoja">
                  {codes.length > 1
                    ? "Muestra cada código en su tienda al retirar."
                    : "Muestra el código en la tienda al retirar."}
                </p>
              </div>
              <div className="space-y-3">
                {codes.map((c) => (
                  <div key={c.code} className="rounded-xl border border-pino/10 bg-white p-3">
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
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
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
                            className="flex items-center gap-3 rounded-xl border border-pino/10 bg-white p-2"
                          >
                            {it.photoUrl ? (
                              <img
                                src={it.photoUrl}
                                alt={it.name}
                                className="size-12 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-cream text-lg">
                                🛒
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setMethod("cashOnPickup")}
                  className={`rounded-lg border-2 p-2 text-center text-sm transition ${
                    method === "cashOnPickup" ? "border-hoja bg-hoja/10 text-pino" : "border-pino/15 text-pino/60"
                  }`}
                >
                  <div>💵</div>
                  Efectivo
                </button>
                <button
                  onClick={() => setMethod("cardMock")}
                  className={`rounded-lg border-2 p-2 text-center text-sm transition ${
                    method === "cardMock" ? "border-hoja bg-hoja/10 text-pino" : "border-pino/15 text-pino/60"
                  }`}
                >
                  <div>💳</div>
                  Tarjeta
                </button>
              </div>
              {method === "cardMock" && (
                <p className="text-xs text-hoja">Pago simulado — no se realiza ningún cobro real.</p>
              )}
              <div className="flex items-center justify-between text-base font-semibold text-pino">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Button onClick={checkout} disabled={busy || items.length === 0} className="w-full bg-pino">
                {busy ? "Procesando…" : "Confirmar pedido"}
              </Button>
            </footer>
          </>
        )}
      </aside>
    </>
  )
}
