"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"
import { GST, WEEKEND_PREMIUM, rupeesToPaise } from "@/lib/pricing"

type Row = {
  id: string
  hotelName: string
  name: string
  baseRate: number
  maxOccupancy: number
  isActive: boolean
}

export default function RateEditor({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Record<string, string>>(
    Object.fromEntries(rows.map((r) => [r.id, String(r.baseRate)]))
  )
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [saved, setSaved] = useState<string | null>(null)

  async function save(id: string) {
    const value = Number(draft[id])
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a rate greater than zero")
      return
    }
    setSaving(id); setError(""); setSaved(null)
    const res = await fetch(`/api/owner/room-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseRate: value }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(null)
    if (!res.ok) { setError(data.error ?? "Couldn't save"); return }
    setSaved(id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const base = Number(draft[r.id]) || 0
        const weekend = Math.round(base * (1 + WEEKEND_PREMIUM))
        const gst = rupeesToPaise(base) > GST.THRESHOLD_PAISE ? GST.HIGH_RATE : GST.LOW_RATE
        const withGst = Math.round(base * (1 + gst))
        const dirty = String(r.baseRate) !== draft[r.id]

        return (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-secondaryText">
                    {r.hotelName} · sleeps {r.maxOccupancy}
                    {!r.isActive && " · inactive"}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-secondaryText">₹</span>
                  <Input
                    value={draft[r.id]}
                    onChange={(e) => setDraft({ ...draft, [r.id]: e.target.value })}
                    inputMode="numeric"
                    className="w-28 h-9"
                  />
                  <Button
                    size="sm"
                    disabled={saving === r.id || !dirty}
                    onClick={() => save(r.id)}
                    className="bg-stayoraTeal hover:bg-stayoraTeal/90"
                  >
                    {saving === r.id ? "Saving…" : dirty ? "Save" : "Saved"}
                  </Button>
                  {saved === r.id && <span className="text-xs text-successGreen">✓</span>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-secondaryText border-t border-border pt-2">
                <span>Base: <strong className="text-primaryText">{formatCurrency(base)}</strong></span>
                <span>Weekend: <strong className="text-primaryText">{formatCurrency(weekend)}</strong></span>
                <span>
                  Incl. {Math.round(gst * 100)}% GST: <strong className="text-primaryText">{formatCurrency(withGst)}</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        )
      })}

      {error && <p className="text-sm text-errorRed">{error}</p>}
    </div>
  )
}
