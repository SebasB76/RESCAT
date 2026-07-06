"use client"
export function RatingStars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1 text-lg">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)}
          className={n <= value ? "text-dorado" : "text-pino/20"}>★</button>
      ))}
    </div>
  )
}
