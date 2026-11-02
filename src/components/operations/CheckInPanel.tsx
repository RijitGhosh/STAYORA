"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

export default function CheckInPanel({
  bookingId, rooms, outstanding,
}: {
  bookingId: string
  rooms: { id: string; roomNumber: string }[]
  outstanding: number
}) {
  const router = useRouter()
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? "")
  const [deposit, setDeposit] = useState("")
  const [notes, setNotes] = useState("")
  const [idVerified, setIdVerified] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function checkIn() {
    setError("")
    if (!roomId) { setError("Assign a physical room before checking in"); return }
    if (!idVerified) { setError("Confirm the guest's photo ID has been verified"); return }

    setBusy(true)
    const res = await fetch(`/api/operations/bookings/${bookingId}/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        depositAmount: deposit ? Number(deposit) : null,
        notes: notes || null,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Check-in failed"); return }
    router.refresh()
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Check in</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {rooms.length === 0 ? (
          <div className="text-sm bg-errorRed/10 border border-errorRed/30 rounded-lg p-3">
            No physical rooms of this type are free for these dates. Free a room under
            Rooms, or reassign the guest to a different room type.
          </div>
        ) : (
          <div>
            <label className="text-sm font-medium mb-2 block">Assign room</label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white"
            >
              {rooms.map((r) => <option key={r.id} value={r.id}>Room {r.roomNumber}</option>)}
            </select>
            <p className="text-xs text-secondaryText mt-1">
              Only rooms of the booked type that are free for the full stay are listed.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Deposit collected (₹)</label>
            <Input value={deposit} onChange={(e) => setDeposit(e.target.value)} inputMode="numeric" placeholder="Optional" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Notes</label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
        </div>

        {outstanding > 0 && (
          <p className="text-xs text-warningAmber">
            {formatCurrency(outstanding)} is still outstanding on this booking. Collect payment at
            the desk if your property requires it before check-in.
          </p>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={idVerified} onChange={(e) => setIdVerified(e.target.checked)} className="mt-0.5 accent-stayoraTeal" />
          I have verified a government photo ID for this guest.
        </label>

        {error && <p className="text-sm text-errorRed">{error}</p>}

        <Button onClick={checkIn} disabled={busy || rooms.length === 0} className="bg-stayoraTeal hover:bg-stayoraTeal/90">
          {busy ? "Checking in…" : "Complete check-in"}
        </Button>
      </CardContent>
    </Card>
  )
}
