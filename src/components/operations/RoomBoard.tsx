"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { BedDouble } from "lucide-react"

type Room = {
  id: string
  roomNumber: string
  roomType: string
  hotelName: string
  status: string
  housekeepingStatus: string
  guest: string | null
  departure: string | null
}

const HK_LABEL: Record<string, string> = {
  CLEANING_REQUIRED: "Needs cleaning",
  CLEANING_IN_PROGRESS: "Cleaning",
  DIRTY: "Dirty",
  INSPECTED: "Inspected",
  READY_FOR_ASSIGNMENT: "Ready",
  CLEAN: "Clean",
}

export default function RoomBoard({ rooms }: { rooms: Room[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("all")

  async function setStatus(id: string, patch: any) {
    setBusy(id); setError("")
    const res = await fetch(`/api/operations/rooms/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? "Couldn't update room"); return }
    router.refresh()
  }

  const shown = rooms.filter((r) => {
    if (filter === "all") return true
    if (filter === "occupied") return r.status === "OCCUPIED"
    if (filter === "available") return r.status === "AVAILABLE"
    if (filter === "cleaning") return ["CLEANING_REQUIRED", "DIRTY", "CLEANING_IN_PROGRESS"].includes(r.housekeepingStatus)
    if (filter === "blocked") return ["MAINTENANCE", "OUT_OF_SERVICE"].includes(r.status)
    return true
  })

  const counts = {
    total: rooms.length,
    occupied: rooms.filter((r) => r.status === "OCCUPIED").length,
    ready: rooms.filter((r) => r.status === "AVAILABLE" && r.housekeepingStatus === "READY_FOR_ASSIGNMENT").length,
    blocked: rooms.filter((r) => ["MAINTENANCE", "OUT_OF_SERVICE"].includes(r.status)).length,
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total rooms", value: counts.total },
          { label: "Occupied", value: counts.occupied },
          { label: "Ready", value: counts.ready },
          { label: "Out of service", value: counts.blocked },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded-lg p-3">
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-xs text-secondaryText">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {[
          { key: "all", label: "All" },
          { key: "occupied", label: "Occupied" },
          { key: "available", label: "Available" },
          { key: "cleaning", label: "Needs cleaning" },
          { key: "blocked", label: "Out of service" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              filter === f.key ? "bg-stayoraTeal text-white border-stayoraTeal" : "bg-white border-border hover:bg-warmWhite"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-errorRed">{error}</p>}

      {shown.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-secondaryText">
          No rooms match this filter.
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {shown.map((r) => {
            const occupied = r.status === "OCCUPIED"
            const blocked = ["MAINTENANCE", "OUT_OF_SERVICE"].includes(r.status)
            const needsCleaning = ["CLEANING_REQUIRED", "DIRTY", "CLEANING_IN_PROGRESS"].includes(r.housekeepingStatus)

            return (
              <Card key={r.id} className={blocked ? "border-errorRed/40" : occupied ? "border-stayoraTeal/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold flex items-center gap-1.5">
                        <BedDouble className="h-4 w-4 text-stayoraTeal" />
                        {r.roomNumber}
                      </p>
                      <p className="text-xs text-secondaryText">{r.roomType} · {r.hotelName}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      occupied ? "bg-stayoraTeal/10 text-stayoraTeal"
                      : blocked ? "bg-errorRed/10 text-errorRed"
                      : "bg-successGreen/10 text-successGreen"
                    }`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="mt-2 text-xs">
                    {r.guest ? (
                      <p className="text-secondaryText">
                        {r.guest} {r.departure ? `· departs ${formatDate(r.departure)}` : ""}
                      </p>
                    ) : (
                      <p className="text-secondaryText">{HK_LABEL[r.housekeepingStatus] ?? r.housekeepingStatus}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {!blocked && (
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs"
                        disabled={busy === r.id || occupied}
                        onClick={() => setStatus(r.id, { status: "MAINTENANCE" })}
                      >
                        Out of service
                      </Button>
                    )}
                    {blocked && (
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs"
                        disabled={busy === r.id}
                        onClick={() => setStatus(r.id, { status: "AVAILABLE" })}
                      >
                        Return to service
                      </Button>
                    )}
                    {!occupied && needsCleaning && (
                      <Button
                        size="sm" className="h-7 text-xs bg-successGreen hover:bg-successGreen/90"
                        disabled={busy === r.id}
                        onClick={() => setStatus(r.id, { housekeepingStatus: "READY_FOR_ASSIGNMENT" })}
                      >
                        Mark clean
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
