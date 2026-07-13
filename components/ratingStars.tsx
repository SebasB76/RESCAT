"use client"
export function RatingStars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1 text-lg" role={onChange ? "group" : undefined} aria-label={onChange ? "Calificación" : `${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={onChange ? `Calificar con ${n} ${n === 1 ? "estrella" : "estrellas"}` : undefined} aria-pressed={onChange ? value === n : undefined}
          className={n <= value ? "text-dorado" : "text-pino/20"}>★</button>
      ))}
    </div>
  )
}
