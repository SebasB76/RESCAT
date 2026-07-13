import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "RESCAT — Rescata productos. Ahorra. Cuida el planeta.",
  description: "Cajas sorpresa de tiendas de barrio en Guayaquil a precio rescate.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning className="min-h-screen bg-cream font-body text-pino antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
