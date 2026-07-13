import Link from "next/link"
import { BrandMark } from "@/components/brandMark"
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-6 py-8">
      <BrandMark />
      <div className="my-auto border-y border-pino/15 py-14">
        <p className="text-sm font-semibold text-hoja">Error 404</p>
        <h1 className="mt-2 text-3xl font-black text-pino">No encontramos esta página.</h1>
        <Link href="/" className="mt-6 inline-block font-semibold text-pino hover:text-hoja">Volver al inicio →</Link>
      </div>
    </main>
  )
}
