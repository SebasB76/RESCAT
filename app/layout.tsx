import type { Metadata } from "next"
import { Fraunces, Hanken_Grotesk } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" })
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" })

export const metadata: Metadata = {
  title: "RESCAT — Rescata comida. Ahorra. Cuida el planeta.",
  description: "Cajas sorpresa de tiendas de barrio en Guayaquil a precio rescate.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${fraunces.variable} ${hanken.variable}`}>
      <body suppressHydrationWarning className="min-h-screen bg-cream font-body text-pino antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
