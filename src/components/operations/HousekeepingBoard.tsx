"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Room = {
  id: string
  roomNumber: string
  roomType: string
  hotelName: string
  status: string
  housekeepingStatus: string
}

const FLOW = [
  { key: "CLEANING_REQUIRED", label: "Needs cleaning", next: "CLEANING_IN_PROGRESS", nextLabel: "Start cleaning" },
  { key: "DIRTY", label: "Dirty", next: "CLEANING_IN_PROGRESS", nextLabel: "Start cleaning" },
  { key: "CLEANING_IN_PROGRESS", label: "Cleaning", next: "INSPECTED", nextLabel: "Finish & inspect" },
  { key: "INSPECTED", label: "Inspected", next: "READY_FOR_ASSIGNMENT", nextLabel: "Mark ready" },
]

const TONE: Record<string, string> = {
  CLEANING_REQUIRED: "border-warningAmber/40",
  DIRTY: "border-warningAmber/40",
  CLEANING_IN_PROGRESS: "border-coral/40",
  INSPECTED: "border-stayoraTeal/40",
  READY_FOR_ASSIGNMENT: "border-border",
}

export default function HousekeepingBoard({
  rooms, tasks, staff,
}: {
  rooms: Room[]
  tasks: { id: string; room: string; status: string; priority: number; assignedTo: string | null; notes: string | null }[]
  staff: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [filter, setFilter] = useState("needs")

  async function advance(room: Room, nextStatus: string) {
    setBusy(room.id); setError("")
    const res = await fetch(`/api/operations/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ housekeepingStatus: nextStatus }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? "Couldn't update"); return }
    router.refresh()
  }

  async function assign(taskId: string, userId: string) {
    setBusy(taskId)
    await fetch(`/api/operations/housekeeping/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedTo: userId || null }),
    })
    setBusy(null)
    router.refresh()
  }

  const needsCleaning = rooms.filter((r) =>
    ["CLEANING_REQUIRED", "DIRTY", "CLEANING_IN_PROGRESS", "INSPECTED"].includes(r.housekeepingStatus)
  )
  const all = rooms

  const shown = filter === "needs" ? needsCleaning : all

  const stageCount = (key: string) => rooms.filter((r) => r.housekeepingStatus === key).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { key: "CLEANING_REQUIRED", label: "Needs cleaning" },
          { key: "CLEANING_IN_PROGRESS", label: "In progress" },
          { key: "INSPECTED", label: "Inspected" },
          { key: "READY_FOR_ASSIGNMENT", label: "Ready" },
        ].map((s) => (
          <div key={s.key} className="bg-white border border-border rounded-lg p-3">
            <p className="text-lg font-bold">{stageCount(s.key)}</p>
            <p className="text-xs text-secondaryText">{s.label}</p>
          </div>
        ))}
      </div>

      {tasks.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">Open tasks</p>
            <ul className="divide-y divide-border text-sm">
              {tasks.map((t) => (
                <li key={t.id} className="py-2 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p>Room {t.room} <span className="text-secondaryText">· {t.notes ?? t.status.replace(/_/g, " ")}</span></p>
                  </div>
                  <select
                    value={t.assignedTo ?? ""}
                    onChange={(e) => assign(t.id, e.target.value)}
                    disabled={busy === t.id}
                    className="h-8 rounded-md border border-border px-2 text-xs bg-white"
                  >
                    <option value="">Unassigned</option>
                    {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1.5">
        <button
          onClick={() => setFilter("needs")}
          className={`text-xs px-3 py-1.5 rounded-full border ${filter === "needs" ? "bg-stayoraTeal text-white border-stayoraTeal" : "bg-white border-border"}`}
        >
          Needs attention ({needsCleaning.length})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`text-xs px-3 py-1.5 rounded-full border ${filter === "all" ? "bg-stayoraTeal text-white border-stayoraTeal" : "bg-white border-border"}`}
        >
          All rooms ({all.length})
        </button>
      </div>

      {error && <p className="text-sm text-errorRed">{error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {shown.map((r) => {
          const stage = FLOW.find((f) => f.key === r.housekeepingStatus)
          return (
            <Card key={r.id} className={TONE[r.housekeepingStatus] ?? ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Room {r.roomNumber}</p>
                    <p className="text-xs text-secondaryText">{r.roomType} · {r.hotelName}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-warmWhite border border-border">
                    {r.housekeepingStatus === "READY_FOR_ASSIGNMENT" ? "Ready" : (stage?.label ?? r.housekeepingStatus.replace(/_/g, " "))}
                  </span>
                </div>

                <div className="mt-2 text-xs text-secondaryText">
                  {r.status === "OCCUPIED" ? "Occupied" : r.status.replace(/_/g, " ")}
                </div>

                {stage && (
                  <Button
                    size="sm"
                    disabled={busy === r.id}
                    onClick={() => advance(r, stage.next)}
                    className="mt-3 h-7 text-xs bg-stayoraTeal hover:bg-stayoraTeal/90"
                  >
                    {stage.nextLabel}
                  </Button>
                )}
                {!stage && r.housekeepingStatus === "READY_FOR_ASSIGNMENT" && (
                  <p className="mt-3 text-xs text-successGreen">Ready for the next guest</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
