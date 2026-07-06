export type StoreScope = { scope: string; storeId: string | null }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function resolveStoreScope(raw: string | undefined | null): StoreScope {
  if (!raw || raw === "todas" || !UUID.test(raw)) return { scope: "todas", storeId: null }
  return { scope: raw, storeId: raw }
}
