import type { Database } from "@/lib/database.types"

export type Tables = Database extends { public: { Tables: infer T } } ? T : never
