export type StoreScope = { scope: string; storeId: string | null }

export function resolveStoreScope(raw: string | undefined | null): StoreScope {
  if (!raw || raw === "todas") return { scope: "todas", storeId: null }
  return { scope: raw, storeId: raw }
}
