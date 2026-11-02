"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const ROLES = ["CUSTOMER", "HOTEL_OWNER", "RECEPTIONIST", "HOUSEKEEPING", "FINANCE", "SUPPORT", "ADMIN"]

export default function UserRoleSelect({ userId, role }: { userId: string; role: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function change(next: string) {
    setError("")
    setBusy(true)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: next }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Couldn't change role"); return }
    router.refresh()
  }

  return (
    <div>
      <select
        value={role}
        disabled={busy}
        onChange={(e) => change(e.target.value)}
        className="h-8 rounded-md border border-border px-2 text-xs bg-white"
      >
        {ROLES.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ")}</option>)}
      </select>
      {error && <p className="text-[11px] text-errorRed mt-1">{error}</p>}
    </div>
  )
}
