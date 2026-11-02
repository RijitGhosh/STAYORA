"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Day = { id: string; date: string; totalRooms: number; available: number; blocked: number }

export default function InventoryCalendar({
  roomTypes, selectedId, days, bookedNights,
}: {
  roomTypes: { id: string; label: string; totalRooms: number }[]
  selectedId: string
  days: Day[]
  bookedNights: Record<string, number>
}) {
  const router = useRouter()
  const [bulk, setBulk] = useState("")
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function setAvailable(id: string, date: string, value: number) {
    setBusy(date); setError("")
    const res = await fetch(`/api/owner/inventory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: value }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? "Couldn't update inventory"); return }
    router.refresh()
  }

  const minAvailable = days.length ? Math.min(...days.map((d) => d.available)) : 0
  const maxTotal = days.length ? Math.max(...days.map((d) => d.totalRooms)) : 0
  const soldOutDays = days.filter((d) => d.available <= 0).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Room type</label>
          <select
            value={selectedId}
            onChange={(e) => router.push(`/owner/inventory?roomTypeId=${e.target.value}`)}
            className="h-9 rounded-md border border-border px-2 text-sm bg-white min-w-[260px]"
          >
            {roomTypes.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs font-medium mb-1 block">Sold-out days</label>
            <p className="text-sm font-semibold">{soldOutDays}</p>
          </div>
          <div className="pl-4 border-l border-border">
            <label className="text-xs font-medium mb-1 block">Lowest availability</label>
            <p className="text-sm font-semibold">{minAvailable} / {maxTotal}</p>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-errorRed">{error}</p>}

      <div className="bg-white border border-border rounded-lg overflow-hidden">
        <div className="max-h-[560px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-deepOceanBlue text-white">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Date</th>
                <th className="text-right px-3 py-2.5 font-medium">Rooms</th>
                <th className="text-right px-3 py-2.5 font-medium">Booked</th>
                <th className="text-right px-3 py-2.5 font-medium">Available</th>
                <th className="text-right px-4 py-2.5 font-medium">Set to</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const booked = bookedNights[d.date] ?? 0
                const dow = new Date(d.date + "T00:00:00Z").getUTCDay()
                const weekend = dow === 5 || dow === 6
                return (
                  <tr key={d.id} className={`border-b border-border last:border-0 ${weekend ? "bg-warmWhite" : ""}`}>
                    <td className="px-4 py-2">
                      <span className="font-medium">
                        {new Date(d.date + "T00:00:00Z").toLocaleDateString("en-IN", {
                          day: "2-digit", month: "short", weekday: "short", timeZone: "UTC",
                        })}
                      </span>
                      {weekend && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-goldenYellow/20 text-warningAmber">weekend rate</span>}
                    </td>
                    <td className="text-right px-3 py-2 text-secondaryText">{d.totalRooms}</td>
                    <td className="text-right px-3 py-2">{booked || "—"}</td>
                    <td className="text-right px-3 py-2">
                      <span className={d.available <= 0 ? "text-errorRed font-semibold" : d.available <= 1 ? "text-warningAmber font-medium" : ""}>
                        {d.available}
                      </span>
                    </td>
                    <td className="text-right px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          disabled={busy === d.date || d.available <= 0}
                          onClick={() => setAvailable(d.id, d.date, d.available - 1)}>−</Button>
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs"
                          disabled={busy === d.date || d.available >= d.totalRooms}
                          onClick={() => setAvailable(d.id, d.date, d.available + 1)}>+</Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-secondaryText">
        Available can never exceed total rooms. Booked counts confirmed and in-house reservations.
      </p>
    </div>
  )
}
