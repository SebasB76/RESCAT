import type { Metadata } from "next"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "RESCAT — Cajas sorpresa contra el desperdicio",
  description: "Reserva cajas sorpresa de tiendas de barrio en Guayaquil a precio de rescate.",
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
