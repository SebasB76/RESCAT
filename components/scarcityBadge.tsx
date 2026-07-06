export function ScarcityBadge({ stock, threshold = 3 }: { stock: number; threshold?: number }) {
  if (stock <= 0 || stock > threshold) return null
  return (
    <span className="inline-flex items-center rounded-full bg-terracota/15 px-2 py-0.5 text-xs font-semibold text-terracota">
      {stock === 1 ? "¡Última!" : `Últimas ${stock}`}
    </span>
  )
}
