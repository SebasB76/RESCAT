"use client"
import { useState } from "react"
import { submitReview } from "@/actions/reviews"
import { RatingStars } from "@/components/ratingStars"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function ReviewForm({ reservationId }: { reservationId: string }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState("")
  const [done, setDone] = useState(false)

  async function submit() {
    try {
      await submitReview(reservationId, rating, comment)
      setDone(true)
      toast.success("¡Gracias por tu reseña!")
    } catch {
      toast.error("No se pudo enviar la reseña")
    }
  }
  if (done) return <p className="text-sm text-hoja">Reseña enviada ✓</p>
  return (
    <div className="mt-2 space-y-2">
      <RatingStars value={rating} onChange={setRating} />
      <Textarea placeholder="¿Cómo estuvo tu caja?" value={comment} onChange={(e) => setComment(e.target.value)} />
      <Button onClick={submit} className="bg-hoja">Enviar reseña</Button>
    </div>
  )
}
