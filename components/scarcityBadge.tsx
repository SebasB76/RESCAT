export function ScarcityBadge({ stock, threshold = 3 }: { stock: number; threshold?: number }) {
  if (stock <= 0 || stock > threshold) return null
  return (
    <span className="inline-flex items-center rounded-md bg-terracota/12 px-2 py-1 text-xs font-bold text-terracota">
      {stock === 1 ? "¡Última!" : `Últimas ${stock}`}
    </span>
  )
}
