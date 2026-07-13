import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { readdirSync, readFileSync, existsSync } from "node:fs"
import { extname, basename, join } from "node:path"
config({ path: ".env.local" })

const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
const admin = createClient(base, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const DIR = "public/productos"

const MAP: Record<string, string[]> = {
  "sal": ["Sal 2kg", "Sal 1kg", "Sal 1/2kg"],
  "azucar-san-carlos": ["Azúcar San Carlos 2kg", "Azúcar San Carlos 1kg", "Azúcar San Carlos 500g", "Azúcar San Carlos 250g"],
  "atun-real": ["Atún Real 160g"],
  "atun-isabel": ["Atún Isabel 160g"],
  "atun-va-vamos": ["Atún Va vamos 160g"],
  "atun-dgussto": ["Atún D'Gussto 140g"],
  "sardina-real": ["Sardina Real 156g", "Sardina Real 425g"],
  "aceite-favorita": ["Aceite Favorita 1lt"],
  "aceite-criollo": ["Aceite Criollo 1lt"],
  "aceite-girasol": ["Aceite Girasol 1lt"],
  "aceite-rica-palma": ["Aceite funda Rica Palma 950ml", "Aceite funda Rica Palma 1lit"],
  "aceite-palma-de-oro": ["Aceite funda Palma de Oro"],
  "choclo-facundo": ["Choclo dulce Facundo 140g", "Choclo dulce Facundo 425g"],
  "leche-nutri": ["Leche en funda Nutri 900ml"],
  "leche-reyleche": ["Leche en funda Reyleche 900ml"],
  "leche-tru": ["Leche en Cartón Trú entera 1lt"],
  "fideo-dona-petrona": ["Fideo Tallarín Doña Petrona 200g", "Fideo Tallarín Doña Petrona 400g"],
  "salsa-tomate-maggi": ["Salsa de tomate Maggi 200g"],
  "mayonesa-maggi": ["Mayonesa Maggi 200g"],
  "sazon-maggi": ["Sazón Maggi 200g", "Sazón Maggi 150g"],
  "pan-supan-molde": ["Pan molde Blanco Supan 550g"],
  "pan-supan-sin-corteza": ["Pan Blanco sin corteza Supan 550g"],
  "rapiditas": ["Rapiditas medianas 250g"],
  "chocolate-cocoa": ["Chocolate Cocoa 160g"],
  "cafe-don-cafe": ["Café Don Café 40g", "Café Don Café 10g"],
  "cafe-oro": ["Café Oro 40g"],
  "cafe-nescafe": ["Café Nescafé tradicional 160g"],
}

const CT: Record<string, string> = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" }

async function main() {
  if (!existsSync(DIR)) { console.error(`falta la carpeta ${DIR}/ — creala y pon ahí las imágenes`); process.exit(1) }
  const files = readdirSync(DIR).filter((f) => CT[extname(f).toLowerCase()])
  if (!files.length) { console.error(`no hay imágenes en ${DIR}/`); process.exit(1) }

  const done = new Set<string>()
  let rows = 0
  for (const f of files) {
    const key = basename(f, extname(f)).toLowerCase()
    const names = MAP[key]
    if (!names) { console.log(`? ${f} — nombre no reconocido, lo salto`); continue }
    const ext = extname(f).toLowerCase()
    const buf = readFileSync(join(DIR, f))
    const path = `real/${key}${ext}`
    const up = await admin.storage.from("box-photos").upload(path, buf, { upsert: true, contentType: CT[ext] })
    if (up.error) { console.log(`✗ ${f} — upload: ${up.error.message}`); continue }
    const url = admin.storage.from("box-photos").getPublicUrl(path).data.publicUrl
    const { error, count } = await admin.from("product").update({ photoUrl: url }, { count: "exact" }).in("name", names)
    if (error) { console.log(`✗ ${f} — update: ${error.message}`); continue }
    rows += count ?? 0
    done.add(key)
    console.log(`✓ ${key} → ${names.length} producto(s)`)
  }

  const missing = Object.keys(MAP).filter((k) => !done.has(k))
  console.log(`\nasociadas ${done.size}/${Object.keys(MAP).length} · ${rows} filas de producto actualizadas`)
  if (missing.length) console.log(`faltan imágenes de: ${missing.join(", ")}`)
}
main()
