export function imageSlugFor(name: string): string | null {
  const n = name.toLowerCase()
  const has = (s: string) => n.includes(s)
  if (has("mayonesa") || has("sazón") || has("sazon") || n.startsWith("salsa")) return "salsa-de-soya-150ml"
  if (n.startsWith("aceite")) return "aceite-de-girasol-1l"
  if (n.startsWith("azúcar") || n.startsWith("azucar")) return "azucar-blanca-2kg"
  if (n.startsWith("atún") || n.startsWith("atun")) return "atun-en-aceite-170g"
  if (n.startsWith("sardina")) return "sardinas-en-salsa-de-tomate"
  if (n.startsWith("choclo")) return "maiz-dulce-en-lata"
  if (n.startsWith("leche")) return "leche-entera-1l"
  if (n.startsWith("fideo")) return "fideos-tallarin-400g"
  if (n.startsWith("pan")) return "pan-de-molde-blanco"
  if (n.startsWith("rapiditas")) return "pan-integral"
  if (n.startsWith("café") || n.startsWith("cafe")) return "cafe-soluble-200g"
  if (n.startsWith("chocolate")) return "barra-de-chocolate-con-leche"
  if (n.startsWith("sal")) return "sal-yodada-1kg"
  return null
}

export function boxImagePath(title: string): string | null {
  const t = title.toLowerCase()
  if (t.includes("desayuno")) return "/cajas/caja-desayuno.webp"
  if (t.includes("despensa")) return "/cajas/caja-despensa.webp"
  return null
}

export function photoUrlFor(baseUrl: string, slug: string): string {
  return `${baseUrl}/storage/v1/object/public/box-photos/products/${slug}.jpg`
}
