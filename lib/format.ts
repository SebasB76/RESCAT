export function money(n: number | null | undefined): string {
  return `$${Number(n ?? 0).toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const STATUS_LABEL: Record<string, string> = {
  reserved: "Reservado",
  pending: "Pendiente",
  paid: "Pagado",
  pickedUp: "Retirado",
  expired: "Expirado",
  cancelled: "Cancelado",
}

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status
}
