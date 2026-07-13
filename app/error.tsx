"use client"
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-6 py-20">
      <p className="text-sm font-semibold text-terracota">No pudimos cargar esta vista</p>
      <h1 className="mt-2 text-3xl font-black text-pino">Algo salió mal.</h1>
      <p className="mt-2 text-pino/72">Tu información sigue segura. Intenta cargar la página de nuevo.</p>
      <button onClick={reset} className="mt-6 min-h-10 self-start rounded-lg bg-pino px-4 text-sm font-semibold text-white hover:bg-hoja">Reintentar</button>
    </main>
  )
}
