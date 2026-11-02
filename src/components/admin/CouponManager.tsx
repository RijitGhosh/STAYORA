"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatCurrency, formatDate } from "@/lib/utils"

type Coupon = {
  id: string
  code: string
  type: string
  value: number
  minBookingAmount: number | null
  maxDiscount: number | null
  usedCount: number
  usageLimit: number | null
  perUserLimit: number
  validTo: string
  isActive: boolean
  redemptions: number
}

export default function CouponManager({ initial }: { initial: Coupon[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const [f, setF] = useState({
    code: "", type: "PERCENTAGE", value: "10", minBookingAmount: "3000",
    maxDiscount: "2000", usageLimit: "1000", perUserLimit: "1", days: "365",
  })

  async function create(e: React.FormEvent) {
    e.preventDefault()
    setBusy("new"); setError("")
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: f.code,
        type: f.type,
        value: Number(f.value),
        minBookingAmount: f.minBookingAmount ? Number(f.minBookingAmount) : null,
        maxDiscount: f.maxDiscount ? Number(f.maxDiscount) : null,
        usageLimit: f.usageLimit ? Number(f.usageLimit) : null,
        perUserLimit: Number(f.perUserLimit),
        validDays: Number(f.days),
      }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? "Couldn't create coupon"); return }
    setAdding(false)
    setF({ ...f, code: "" })
    router.refresh()
  }

  async function toggle(id: string, isActive: boolean) {
    setBusy(id); setError("")
    const res = await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? "Couldn't update"); return }
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-errorRed">{error}</p>}

      {initial.map((c) => (
        <Card key={c.id}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono font-semibold">{c.code}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    c.isActive ? "bg-successGreen/10 text-successGreen" : "bg-secondaryText/10 text-secondaryText"
                  }`}>
                    {c.isActive ? "active" : "inactive"}
                  </span>
                </div>
                <p className="text-sm text-secondaryText mt-1">
                  {c.type === "PERCENTAGE" ? `${c.value}% off` : `${formatCurrency(c.value)} off`}
                  {c.maxDiscount ? ` · max ${formatCurrency(c.maxDiscount)}` : ""}
                  {c.minBookingAmount ? ` · min spend ${formatCurrency(c.minBookingAmount)}` : ""}
                </p>
                <p className="text-xs text-secondaryText mt-0.5">
                  Redeemed {c.usageLimit ? `${c.usedCount}/${c.usageLimit}` : c.usedCount} times ·
                  {" "}{c.perUserLimit} per customer · expires {formatDate(c.validTo)}
                </p>
              </div>
              <Button
                size="sm" variant="outline" disabled={busy === c.id}
                onClick={() => toggle(c.id, !c.isActive)}
              >
                {c.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {adding ? (
        <Card>
          <CardContent className="p-4">
            <form onSubmit={create} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Code</label>
                  <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} required placeholder="SUMMER20" className="uppercase" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Type</label>
                  <select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed amount</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Value</label>
                  <Input value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} inputMode="numeric" required />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Min booking (₹)</label>
                  <Input value={f.minBookingAmount} onChange={(e) => setF({ ...f, minBookingAmount: e.target.value })} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Max discount (₹)</label>
                  <Input value={f.maxDiscount} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Total uses</label>
                  <Input value={f.usageLimit} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Per customer</label>
                  <Input value={f.perUserLimit} onChange={(e) => setF({ ...f, perUserLimit: e.target.value })} inputMode="numeric" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Valid for (days)</label>
                  <Input value={f.days} onChange={(e) => setF({ ...f, days: e.target.value })} inputMode="numeric" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={busy === "new"} className="bg-stayoraTeal hover:bg-stayoraTeal/90">
                  {busy === "new" ? "Creating…" : "Create coupon"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)}>+ New coupon</Button>
      )}
    </div>
  )
}
