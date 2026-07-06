import { redirect } from "next/navigation"

export default async function ReserveRedirect({ params }: { params: Promise<{ boxId: string }> }) {
  const { boxId } = await params
  redirect(`/box/${boxId}`)
}
