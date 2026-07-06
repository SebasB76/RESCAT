"use client"
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-display text-2xl text-pino">Algo salió mal</h1>
      <p className="mt-2 text-hoja">Intenta de nuevo.</p>
      <button onClick={reset} className="mt-4 rounded-lg bg-pino px-4 py-2 text-white">Reintentar</button>
    </main>
  )
}
