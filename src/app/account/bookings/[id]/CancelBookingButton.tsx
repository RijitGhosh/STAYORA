"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function cancel() {
    setBusy(true)
    setError("")
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(data.error ?? "Couldn't cancel this booking")
      setBusy(false)
      return
    }
    router.refresh()
    setConfirming(false)
    setBusy(false)
  }

  if (!confirming) {
    return (
      <Button variant="outline" className="border-errorRed text-errorRed hover:bg-errorRed/5" onClick={() => setConfirming(true)}>
        Cancel booking
      </Button>
    )
  }

  return (
    <div className="bg-white border border-errorRed/30 rounded-lg p-3 text-sm">
      <p className="mb-2 font-medium">Cancel this booking?</p>
      <p className="text-xs text-secondaryText mb-2">Rooms are released back to inventory immediately.</p>
      {error && <p className="text-xs text-errorRed mb-2">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" variant="destructive" onClick={cancel} disabled={busy}>
          {busy ? "Cancelling…" : "Yes, cancel"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>Keep booking</Button>
      </div>
    </div>
  )
}
