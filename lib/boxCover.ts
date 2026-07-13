type BoxCoverInput = {
  photoUrl?: string | null
  title: string
  category?: string | null
  items?: string[] | null
}

const BREAKFAST_COVER = "/cajas/caja-desayuno.webp"
const PANTRY_COVER = "/cajas/caja-despensa.webp"

function isLegacyProductPhoto(photoUrl: string) {
  return photoUrl.includes("/box-photos/products/") || photoUrl.includes("/productos/")
}

export function boxCoverFor({ photoUrl, title, category, items }: BoxCoverInput) {
  if (photoUrl && !isLegacyProductPhoto(photoUrl)) return photoUrl

  const context = [title, category, ...(items ?? [])].join(" ").toLocaleLowerCase("es")
  const isBreakfast = /desayuno|café|cafe|pan|leche|chocolate|cocoa/.test(context)
  return isBreakfast ? BREAKFAST_COVER : PANTRY_COVER
}
