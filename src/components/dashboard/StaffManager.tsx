"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const ROLES = ["MANAGER", "RECEPTION", "HOUSEKEEPING", "FINANCE"]

export default function StaffManager({
  hotels, candidates, memberships,
}: {
  hotels: { id: string; name: string }[]
  candidates: { id: string; name: string; email: string; role: string }[]
  memberships: { id: string; hotelName: string; userName: string; email: string; role: string }[]
}) {
  const router = useRouter()
  const [hotelId, setHotelId] = useState(hotels[0]?.id ?? "")
  const [userId, setUserId] = useState("")
  const [role, setRole] = useState("RECEPTION")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function grant(e: React.FormEvent) {
    e.preventDefault()
    if (!hotelId || !userId) { setError("Choose a property and a person"); return }
    setBusy(true); setError("")
    const res = await fetch("/api/owner/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hotelId, userId, role }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Couldn't grant access"); return }
    setUserId("")
    router.refresh()
  }

  async function revoke(id: string) {
    setBusy(true)
    await fetch(`/api/owner/staff?id=${id}`, { method: "DELETE" })
    setBusy(false)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <form onSubmit={grant} className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[160px]">
              <label className="text-xs font-medium mb-1 block">Property</label>
              <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="h-9 w-full rounded-md border border-border px-2 text-sm bg-white">
                {hotels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
            <div className="min-w-[180px] flex-1">
              <label className="text-xs font-medium mb-1 block">Person</label>
              <select value={userId} onChange={(e) => setUserId(e.target.value)} className="h-9 w-full rounded-md border border-border px-2 text-sm bg-white">
                <option value="">Select a user…</option>
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[140px]">
              <label className="text-xs font-medium mb-1 block">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="h-9 w-full rounded-md border border-border px-2 text-sm bg-white">
                {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
            <Button type="submit" size="sm" disabled={busy} className="h-9 bg-stayoraTeal hover:bg-stayoraTeal/90">
              Grant access
            </Button>
          </form>
          {error && <p className="text-sm text-errorRed mt-2">{error}</p>}
        </CardContent>
      </Card>

      {memberships.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-secondaryText">
          No staff assigned yet.
        </CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-deepOceanBlue text-white">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Property</th>
                  <th className="text-left px-4 py-2.5 font-medium">Person</th>
                  <th className="text-left px-4 py-2.5 font-medium">Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">{m.hotelName}</td>
                    <td className="px-4 py-2.5">
                      {m.userName}
                      <div className="text-[11px] text-secondaryText">{m.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-secondaryText">{m.role}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-errorRed"
                        disabled={busy} onClick={() => revoke(m.id)}>
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
