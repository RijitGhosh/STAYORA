"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { Star, ExternalLink } from "lucide-react"

type HotelRow = {
  id: string
  name: string
  slug: string
  status: string
  city: string
  ownerName: string
  ownerEmail: string
  roomTypes: number
  bookings: number
  starRating: number | null
  createdAt: string
}

export default function HotelApprovalList({ hotels }: { hotels: HotelRow[] }) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  async function act(id: string, status: string) {
    setBusy(id); setError("")
    const res = await fetch(`/api/admin/hotels/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(null)
    if (!res.ok) { setError(data.error ?? "Action failed"); return }
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-errorRed">{error}</p>}
      {hotels.map((h) => (
        <Card key={h.id}>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{h.name}</p>
                  {h.starRating ? (
                    <span className="flex">
                      {Array.from({ length: h.starRating }).map((_, i) => (
                        <Star key={i} className="h-3 w-3 fill-goldenYellow text-goldenYellow" />
                      ))}
                    </span>
                  ) : null}
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-warmWhite border border-border">
                    {h.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-xs text-secondaryText mt-1">
                  {h.city} · {h.roomTypes} room type{h.roomTypes === 1 ? "" : "s"} · {h.bookings} booking{h.bookings === 1 ? "" : "s"}
                </p>
                <p className="text-xs text-secondaryText">
                  Owner: {h.ownerName} ({h.ownerEmail}) · added {formatDate(h.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5 shrink-0">
                <Link href={`/hotels/${h.slug}`} target="_blank">
                  <Button size="sm" variant="ghost" className="h-8 text-xs">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" /> View
                  </Button>
                </Link>
                {h.status !== "APPROVED" && (
                  <Button size="sm" className="h-8 text-xs bg-successGreen hover:bg-successGreen/90"
                    disabled={busy === h.id} onClick={() => act(h.id, "APPROVED")}>
                    Approve
                  </Button>
                )}
                {h.status === "PENDING_APPROVAL" && (
                  <Button size="sm" variant="outline" className="h-8 text-xs border-errorRed/40 text-errorRed"
                    disabled={busy === h.id} onClick={() => act(h.id, "REJECTED")}>
                    Reject
                  </Button>
                )}
                {h.status === "APPROVED" && (
                  <Button size="sm" variant="outline" className="h-8 text-xs border-errorRed/40 text-errorRed"
                    disabled={busy === h.id} onClick={() => act(h.id, "SUSPENDED")}>
                    Suspend
                  </Button>
                )}
                {h.status === "SUSPENDED" && (
                  <Button size="sm" className="h-8 text-xs bg-successGreen hover:bg-successGreen/90"
                    disabled={busy === h.id} onClick={() => act(h.id, "APPROVED")}>
                    Reinstate
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
