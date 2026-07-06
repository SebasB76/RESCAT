import Link from "next/link"
export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-display text-2xl text-pino">No encontrado</h1>
      <Link href="/" className="mt-4 inline-block text-hoja underline">Volver al inicio</Link>
    </main>
  )
}
