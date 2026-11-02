"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { Plus, Trash2 } from "lucide-react"

export type Charge = { id: string; description: string; amount: number; createdAt: string }

export default function ExtraCharges({
  bookingId, charges, locked,
}: {
  bookingId: string
  charges: Charge[]
  locked: boolean
}) {
  const router = useRouter()
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const value = Number(amount)
    if (!description.trim()) { setError("Describe the charge"); return }
    if (!Number.isFinite(value) || value <= 0) { setError("Enter an amount greater than zero"); return }

    setBusy(true)
    const res = await fetch(`/api/operations/bookings/${bookingId}/charges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, amount: value }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Couldn't add charge"); return }
    setDescription(""); setAmount("")
    router.refresh()
  }

  async function remove(id: string) {
    setBusy(true)
    await fetch(`/api/operations/bookings/${bookingId}/charges?chargeId=${id}`, { method: "DELETE" })
    setBusy(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Additional charges</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {charges.length === 0 ? (
          <p className="text-sm text-secondaryText">No extra charges on this folio.</p>
        ) : (
          <ul className="divide-y divide-border">
            {charges.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <p>{c.description}</p>
                  <p className="text-xs text-secondaryText">
                    {new Date(c.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{formatCurrency(c.amount)}</span>
                  {!locked && (
                    <button
                      onClick={() => remove(c.id)}
                      disabled={busy}
                      className="text-errorRed hover:bg-errorRed/10 p-1 rounded"
                      aria-label="Remove charge"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {!locked && (
          <form onSubmit={add} className="flex flex-wrap gap-2 items-end pt-2 border-t border-border">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium mb-1 block">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Minibar, laundry, airport transfer…" />
            </div>
            <div className="w-28">
              <label className="text-xs font-medium mb-1 block">Amount (₹)</label>
              <Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="0" />
            </div>
            <Button type="submit" size="sm" disabled={busy} className="bg-stayoraTeal hover:bg-stayoraTeal/90">
              <Plus className="h-3.5 w-3.5 mr-1" /> Add
            </Button>
          </form>
        )}

        {error && <p className="text-sm text-errorRed">{error}</p>}
      </CardContent>
    </Card>
  )
}
