"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency } from "@/lib/utils"

type RoomTypeRow = {
  id: string
  name: string
  baseRate: number
  maxOccupancy: number
  bedConfiguration: string
  isActive: boolean
  rooms: { id: string; roomNumber: string; status: string }[]
}

export default function RoomTypeManager({
  hotelId, roomTypes,
}: {
  hotelId: string
  roomTypes: RoomTypeRow[]
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  const [form, setForm] = useState({
    name: "", description: "", baseRate: "3000", maxOccupancy: "2",
    maxAdults: "2", maxChildren: "0", bedConfiguration: "1 Queen Bed",
    size: "24 m²", roomCount: "3", roomPrefix: "",
  })

  function reset() {
    setForm({
      name: "", description: "", baseRate: "3000", maxOccupancy: "2",
      maxAdults: "2", maxChildren: "0", bedConfiguration: "1 Queen Bed",
      size: "24 m²", roomCount: "3", roomPrefix: "",
    })
  }

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError("")
    const res = await fetch(`/api/owner/hotels/${hotelId}/room-types`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        baseRate: Number(form.baseRate),
        maxOccupancy: Number(form.maxOccupancy),
        maxAdults: Number(form.maxAdults),
        maxChildren: Number(form.maxChildren),
        roomCount: Number(form.roomCount),
      }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Couldn't create room type"); return }
    setAdding(false); reset(); router.refresh()
  }

  async function update(id: string, patch: any) {
    setBusy(true); setError("")
    const res = await fetch(`/api/owner/room-types/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Couldn't update"); return }
    setEditing(null); router.refresh()
  }

  async function addRooms(id: string, count: number) {
    setBusy(true); setError("")
    const res = await fetch(`/api/owner/room-types/${id}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Couldn't add rooms"); return }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {roomTypes.length === 0 && !adding && (
        <p className="text-sm text-secondaryText">
          No room types yet. Add one so guests have something to book.
        </p>
      )}

      <div className="space-y-3">
        {roomTypes.map((rt) => (
          <div key={rt.id} className="border border-border rounded-lg p-4">
            {editing === rt.id ? (
              <EditRow rt={rt} onSave={(patch) => update(rt.id, patch)} onCancel={() => setEditing(null)} busy={busy} />
            ) : (
              <div className="flex flex-wrap justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{rt.name}</p>
                    {!rt.isActive && (
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondaryText/10 text-secondaryText">inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-secondaryText mt-0.5">
                    {rt.bedConfiguration} · sleeps {rt.maxOccupancy} · {rt.rooms.length} physical room{rt.rooms.length === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-secondaryText mt-1">
                    Rooms: {rt.rooms.map((r) => r.roomNumber).join(", ") || "none"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold">{formatCurrency(rt.baseRate)}<span className="text-xs font-normal text-secondaryText"> /night</span></p>
                  <div className="flex gap-2 mt-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditing(rt.id)}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => addRooms(rt.id, 1)} disabled={busy}>+ Room</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => update(rt.id, { isActive: !rt.isActive })}
                      disabled={busy}
                    >
                      {rt.isActive ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-errorRed">{error}</p>}

      {adding ? (
        <form onSubmit={create} className="border border-stayoraTeal/40 bg-stayoraTeal/5 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Deluxe Room" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Bed configuration</label>
              <Input value={form.bedConfiguration} onChange={(e) => setForm({ ...form, bedConfiguration: e.target.value })} required />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium mb-1 block">Description</label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="What's in the room?" />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Base rate (₹ / night)</label>
              <Input value={form.baseRate} onChange={(e) => setForm({ ...form, baseRate: e.target.value })} inputMode="numeric" required />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Max occupancy</label>
              <Input value={form.maxOccupancy} onChange={(e) => setForm({ ...form, maxOccupancy: e.target.value })} inputMode="numeric" required />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Physical rooms to create</label>
              <Input value={form.roomCount} onChange={(e) => setForm({ ...form, roomCount: e.target.value })} inputMode="numeric" required />
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">Room number prefix (optional)</label>
              <Input value={form.roomPrefix} onChange={(e) => setForm({ ...form, roomPrefix: e.target.value })} placeholder="e.g. 2" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={busy} className="bg-stayoraTeal hover:bg-stayoraTeal/90">
              {busy ? "Creating…" : "Create room type"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => { setAdding(false); reset() }}>Cancel</Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>+ Add room type</Button>
      )}
    </div>
  )
}

function EditRow({
  rt, onSave, onCancel, busy,
}: {
  rt: RoomTypeRow
  onSave: (patch: any) => void
  onCancel: () => void
  busy: boolean
}) {
  const [name, setName] = useState(rt.name)
  const [rate, setRate] = useState(String(rt.baseRate))
  const [occ, setOcc] = useState(String(rt.maxOccupancy))
  const [beds, setBeds] = useState(rt.bedConfiguration)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium mb-1 block">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Bed configuration</label>
          <Input value={beds} onChange={(e) => setBeds(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Base rate (₹ / night)</label>
          <Input value={rate} onChange={(e) => setRate(e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1 block">Max occupancy</label>
          <Input value={occ} onChange={(e) => setOcc(e.target.value)} inputMode="numeric" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={busy}
          className="bg-stayoraTeal hover:bg-stayoraTeal/90"
          onClick={() => onSave({
            name,
            baseRate: Number(rate),
            maxOccupancy: Number(occ),
            bedConfiguration: beds,
          })}
        >
          Save
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  )
}
