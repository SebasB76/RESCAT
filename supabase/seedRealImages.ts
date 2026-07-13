import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import { imageSlugFor, boxImageSlug, photoUrlFor } from "./catalogImages"
config({ path: ".env.local" })

const base = process.env.NEXT_PUBLIC_SUPABASE_URL!
const admin = createClient(base, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  const { data: products } = await admin.from("product").select("id,name")
  let pn = 0
  const missing: string[] = []
  for (const p of products ?? []) {
    const slug = imageSlugFor(p.name)
    if (!slug) { missing.push(p.name); continue }
    const { error } = await admin.from("product").update({ photoUrl: photoUrlFor(base, slug) }).eq("id", p.id)
    if (!error) pn++
  }

  const { data: boxes } = await admin.from("box").select("id,title")
  let bn = 0
  for (const b of boxes ?? []) {
    const slug = boxImageSlug(b.title)
    if (!slug) continue
    const { error } = await admin.from("box").update({ photoUrl: photoUrlFor(base, slug) }).eq("id", b.id)
    if (!error) bn++
  }

  console.log(`photos set · ${pn} product rows · ${bn} boxes`)
  if (missing.length) console.log(`no image match · ${[...new Set(missing)].join(", ")}`)
}
main()
