import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { readFileSync } from "node:fs"

config({ path: ".env.local" })

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const BUCKET = "box-photos"

function extractObject(source: string, varName: string): Record<string, string> {
  const start = source.indexOf(varName)
  if (start < 0) throw new Error(`${varName} not found`)
  const braceStart = source.indexOf("{", start)
  let depth = 0, inStr = false, esc = false, i = braceStart
  for (; i < source.length; i++) {
    const c = source[i]
    if (inStr) {
      if (esc) esc = false
      else if (c === "\\") esc = true
      else if (c === '"') inStr = false
    } else if (c === '"') inStr = true
    else if (c === "{") depth++
    else if (c === "}") { depth--; if (depth === 0) { i++; break } }
  }
  return JSON.parse(source.slice(braceStart, i))
}

function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function main() {
  const raw = readFileSync("legacy/rescat_images.js", "utf8")
  const images = extractObject(raw, "const IMGS_PRODS")

  const names = Object.keys(images)
  const slugs = new Map<string, string>()
  for (const name of names) {
    const slug = slugify(name)
    for (const [other, otherSlug] of slugs) {
      if (otherSlug === slug) throw new Error(`slug collision: "${name}" and "${other}" -> ${slug}`)
    }
    slugs.set(name, slug)
  }

  let uploaded = 0, updated = 0
  for (const name of names) {
    const dataUri = images[name]
    const match = dataUri.match(/^data:(image\/[a-z]+);base64,(.+)$/i)
    if (!match) { console.error(`✗ bad data uri: ${name}`); continue }
    const [, contentType, b64] = match
    const buffer = Buffer.from(b64, "base64")
    const path = `products/${slugs.get(name)}.jpg`

    const up = await admin.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: true })
    if (up.error) { console.error(`✗ upload ${name}`, up.error.message); continue }
    uploaded++

    const publicUrl = admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    const res = await admin.from("product").update({ photoUrl: publicUrl }).eq("name", name).select("id")
    if (res.error) { console.error(`✗ update ${name}`, res.error.message); continue }
    updated += res.data?.length ?? 0
  }

  console.log(`seed images done · ${uploaded}/${names.length} uploaded · ${updated} product rows updated`)
}

main()
