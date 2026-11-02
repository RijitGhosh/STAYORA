"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

export default function CheckOutPanel({
  bookingId, balanceDue,
}: {
  bookingId: string
  balanceDue: number
}) {
  const router = useRouter()
  const [payment, setPayment] = useState(balanceDue > 0 ? String(balanceDue) : "")
  const [notes, setNotes] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function checkOut() {
    setError("")
    const amount = payment ? Number(payment) : 0
    if (!Number.isFinite(amount) || amount < 0) { setError("Enter a valid payment amount"); return }

    setBusy(true)
    const res = await fetch(`/api/operations/bookings/${bookingId}/check-out`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentAmount: amount, notes: notes || null }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Check-out failed"); return }
    router.refresh()
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Check out</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Payment collected now (₹)</label>
            <Input value={payment} onChange={(e) => setPayment(e.target.value)} inputMode="numeric" placeholder="0" />
            <p className="text-xs text-secondaryText mt-1">
              Balance due is {formatCurrency(balanceDue)}. This records money taken at the desk.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        {error && <p className="text-sm text-errorRed">{error}</p>}

        <Button onClick={checkOut} disabled={busy} className="bg-coral hover:bg-coral/90">
          {busy ? "Checking out…" : "Complete check-out & generate bill"}
        </Button>
        <p className="text-xs text-secondaryText">
          Check-out records the departure time, closes the folio and marks the room for housekeeping.
        </p>
      </CardContent>
    </Card>
  )
}
