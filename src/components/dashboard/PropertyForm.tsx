"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const TYPES = ["LUXURY", "BUSINESS", "RESORT", "HERITAGE", "BUDGET"]

export type PropertyInitial = {
  id?: string
  name?: string
  description?: string
  address?: string
  cityId?: string
  pincode?: string
  phone?: string
  email?: string
  starRating?: number | null
  hotelType?: string
  checkInTime?: string
  checkOutTime?: string
  gstin?: string | null
  commissionRate?: number
}

export default function PropertyForm({
  cities,
  mode,
  initial,
}: {
  cities: { id: string; label: string }[]
  mode: "create" | "edit"
  initial?: PropertyInitial
}) {
  const router = useRouter()
  const [f, setF] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    address: initial?.address ?? "",
    cityId: initial?.cityId ?? cities[0]?.id ?? "",
    pincode: initial?.pincode ?? "",
    phone: initial?.phone ?? "",
    email: initial?.email ?? "",
    starRating: String(initial?.starRating ?? 3),
    hotelType: initial?.hotelType ?? "BUSINESS",
    checkInTime: initial?.checkInTime ?? "14:00",
    checkOutTime: initial?.checkOutTime ?? "11:00",
    gstin: initial?.gstin ?? "",
    commissionRate: String(initial?.commissionRate ?? 12),
  })
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  function set(k: keyof typeof f) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setF((s) => ({ ...s, [k]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setBusy(true)

    const payload = {
      ...f,
      starRating: Number(f.starRating),
      commissionRate: Number(f.commissionRate),
    }

    const res = await fetch(
      mode === "create" ? "/api/owner/hotels" : `/api/owner/hotels/${initial?.id}`,
      {
        method: mode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    const data = await res.json().catch(() => ({}))
    setBusy(false)

    if (!res.ok) {
      setError(data.error ?? "Couldn't save this property")
      return
    }

    router.push(`/owner/properties/${data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-2 block">Property name</label>
          <Input value={f.name} onChange={set("name")} required placeholder="e.g. The Imperial Meridian" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-2 block">Description</label>
          <textarea
            value={f.description}
            onChange={set("description")}
            required
            rows={4}
            placeholder="What makes this property worth staying at?"
            className="w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stayoraTeal"
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">City</label>
          <select value={f.cityId} onChange={set("cityId")} required className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
            {cities.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">PIN code</label>
          <Input value={f.pincode} onChange={set("pincode")} required placeholder="400001" inputMode="numeric" />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium mb-2 block">Street address</label>
          <Input value={f.address} onChange={set("address")} required placeholder="Building, street, area" />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Phone</label>
          <Input value={f.phone} onChange={set("phone")} required placeholder="+91 22 4000 0000" />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Reservations email</label>
          <Input type="email" value={f.email} onChange={set("email")} required placeholder="reservations@property.com" />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Star rating</label>
          <select value={f.starRating} onChange={set("starRating")} className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Property type</label>
          <select value={f.hotelType} onChange={set("hotelType")} className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
            {TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Check-in time</label>
          <Input type="time" value={f.checkInTime} onChange={set("checkInTime")} />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Check-out time</label>
          <Input type="time" value={f.checkOutTime} onChange={set("checkOutTime")} />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">GSTIN (optional)</label>
          <Input value={f.gstin} onChange={set("gstin")} placeholder="22AAAAA0000A1Z5" />
        </div>

        {mode === "edit" && (
          <div>
            <label className="text-sm font-medium mb-2 block">Platform commission (%)</label>
            <Input value={f.commissionRate} onChange={set("commissionRate")} inputMode="decimal" />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-errorRed">{error}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={busy} className="bg-stayoraTeal hover:bg-stayoraTeal/90">
          {busy ? "Saving…" : mode === "create" ? "Submit for approval" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>

      {mode === "create" && (
        <p className="text-xs text-secondaryText">
          Submitted properties enter an approval queue. They are not bookable until approved.
        </p>
      )}
    </form>
  )
}
