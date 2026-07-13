import { describe, expect, it } from "vitest"
import { boxCoverFor } from "@/lib/boxCover"

describe("boxCoverFor", () => {
  it("preserva la foto propia que sube una tienda", () => {
    expect(boxCoverFor({ photoUrl: "https://cdn.example.com/box-photos/store/caja.webp", title: "Caja del día" }))
      .toBe("https://cdn.example.com/box-photos/store/caja.webp")
  })

  it("reemplaza una foto heredada del catálogo por una portada de caja", () => {
    expect(boxCoverFor({
      photoUrl: "https://example.supabase.co/storage/v1/object/public/box-photos/products/pan-de-molde-blanco.jpg",
      title: "Caja Desayuno",
    })).toBe("/cajas/caja-desayuno.webp")
  })

  it("elige una caja de desayuno a partir de su contenido", () => {
    expect(boxCoverFor({ photoUrl: null, title: "Sorpresa del día", items: ["Café", "Leche"] }))
      .toBe("/cajas/caja-desayuno.webp")
  })

  it("usa la portada de despensa como fallback general", () => {
    expect(boxCoverFor({ photoUrl: null, title: "Caja sorpresa" }))
      .toBe("/cajas/caja-despensa.webp")
  })
})
