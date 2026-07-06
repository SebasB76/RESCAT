import { Suspense } from "react"
import { Storefront } from "@/components/storefront"

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-cream" />}>
      <Storefront />
    </Suspense>
  )
}
