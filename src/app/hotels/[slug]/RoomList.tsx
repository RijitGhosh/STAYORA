"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { BedDouble, Users, ArrowRight } from "lucide-react"
import type { QuoteLine } from "@/lib/booking-service"

export default function RoomList({
  hotelName, lines, checkIn, checkOut, rooms, adults, children,
}: {
  hotelSlug: string
  hotelName: string
  lines: QuoteLine[]
  checkIn: string
  checkOut: string
  rooms: number
  adults: number
  children: number
}) {
  const router = useRouter()
  const [selected, setSelected] = useState<string>(lines[0]?.roomTypeId ?? "")

  const line = lines.find((l) => l.roomTypeId === selected) ?? lines[0]

  function go() {
    if (!line) return
    const qs = new URLSearchParams({
      roomTypeId: line.roomTypeId,
      checkIn,
      checkOut,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
    })
    router.push(`/checkout?${qs.toString()}`)
  }

  return (
    <div id="rooms" className="space-y-3">
      {lines.map((l) => {
        const active = l.roomTypeId === selected
        return (
          <div
            key={l.roomTypeId}
            onClick={() => setSelected(l.roomTypeId)}
            className={`rounded-lg border p-4 cursor-pointer transition-colors ${
              active ? "border-stayoraTeal bg-stayoraTeal/5" : "border-border hover:border-stayoraTeal/40"
            }`}
          >
            <div className="flex flex-wrap justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold">{l.roomTypeName}</p>
                <div className="flex flex-wrap gap-3 text-xs text-secondaryText mt-1">
                  <span className="inline-flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" /> {l.bedConfiguration}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Sleeps {l.maxOccupancy}
                  </span>
                  <span className="text-successGreen">{l.available} left</span>
                </div>
                <p className="text-xs text-secondaryText mt-2">
                  {formatCurrency(l.price.nights[0]?.ratePaise ? l.price.nights[0].ratePaise / 100 : l.baseRate)} per
                  night · {l.price.numberOfNights} night{l.price.numberOfNights === 1 ? "" : "s"}
                </p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-xl font-bold text-deepOceanBlue">{formatCurrency(l.price.totalAmount)}</p>
                <p className="text-xs text-secondaryText">
                  total incl. {Math.round(l.price.gstRate * 100)}% GST
                </p>
                <p className="text-xs text-secondaryText">
                  {formatCurrency(l.price.roomCharges)} + {formatCurrency(l.price.taxes)} tax
                </p>
              </div>
            </div>
          </div>
        )
      })}

      {line && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-sm text-secondaryText">
            {line.roomTypeName} · {formatCurrency(line.price.totalAmount)} total
          </p>
          <Button onClick={go} className="bg-coral hover:bg-coral/90">
            Continue to booking
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  )
}
