"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react"

function iso(d: Date) {
  return d.toISOString().slice(0, 10)
}
function utcToday() {
  const d = new Date()
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}
function addDays(d: Date, n: number) {
  const x = new Date(d)
  x.setUTCDate(x.getUTCDate() + n)
  return x
}
function nightsBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))
}
function fmt(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  })
}
function monthLabel(d: Date) {
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })
}

export default function BookingWidget({
  hotelSlug,
  checkIn: initialIn,
  checkOut: initialOut,
  rooms: initialRooms,
  adults: initialAdults,
  children: initialChildren,
  maxGuestsPerRoom = 4,
  basePrice,
}: {
  hotelSlug: string
  checkIn: string
  checkOut: string
  rooms: number
  adults: number
  children: number
  maxGuestsPerRoom?: number
  basePrice: number
}) {
  const router = useRouter()

  const [checkIn, setCheckIn] = useState(initialIn)
  const [checkOut, setCheckOut] = useState(initialOut)
  const [rooms, setRooms] = useState(initialRooms)
  const [adults, setAdults] = useState(initialAdults)
  const [children, setChildren] = useState(initialChildren)

  const [open, setOpen] = useState(false)
  const [cursor, setCursor] = useState<Date>(() => {
    const d = new Date(initialIn + "T00:00:00Z")
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  })
  const [hover, setHover] = useState<string | null>(null)
  const [picking, setPicking] = useState<"in" | "out">("in")

  const today = utcToday()
  const nights = nightsBetween(checkIn, checkOut)
  const maxAdults = maxGuestsPerRoom * rooms
  const maxChildren = Math.max(0, (maxGuestsPerRoom - 2) * rooms)
  const guests = adults + children
  const overCapacity = guests > maxGuestsPerRoom * rooms

  /** Build the two visible month grids. */
  const months = useMemo(() => {
    return [0, 1].map((offset) => {
      const first = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + offset, 1))
      const year = first.getUTCFullYear()
      const month = first.getUTCMonth()
      const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
      const startWeekday = first.getUTCDay()
      const cells: (Date | null)[] = []
      for (let i = 0; i < startWeekday; i++) cells.push(null)
      for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(Date.UTC(year, month, d)))
      while (cells.length % 7 !== 0) cells.push(null)
      return { label: monthLabel(first), cells }
    })
  }, [cursor])

  function pickDate(day: Date) {
    const v = iso(day)
    if (picking === "in") {
      setCheckIn(v)
      // Keep a valid range: if check-out is on/before the new check-in, push it out one night.
      if (new Date(v) >= new Date(checkOut)) setCheckOut(iso(addDays(day, 1)))
      setPicking("out")
      return
    }

    // picking checkout
    if (new Date(v) <= new Date(checkIn)) {
      // Clicked before check-in — restart the selection from here.
      setCheckIn(v)
      setCheckOut(iso(addDays(day, 1)))
      setPicking("out")
      return
    }
    setCheckOut(v)
    setPicking("in")
    setOpen(false)
  }

  function apply() {
    const qs = new URLSearchParams({
      checkIn, checkOut, rooms: String(rooms), adults: String(adults), children: String(children),
    })
    router.push(`/hotels/${hotelSlug}?${qs.toString()}`)
    router.refresh()
  }

  function inRange(day: Date) {
    const v = iso(day)
    const end = picking === "out" && hover && new Date(hover) > new Date(checkIn) ? hover : checkOut
    return v > checkIn && v < end
  }

  const estimate = basePrice * Math.max(1, nights) * rooms

  return (
    <div className="bg-white border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-deepOceanBlue">Your stay</h3>
        {nights > 0 && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-stayoraTeal/10 text-stayoraTeal">
            {nights} night{nights === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {/* Date range trigger */}
      <button
        onClick={() => { setOpen((o) => !o); setPicking("in") }}
        className="w-full grid grid-cols-2 divide-x divide-border border border-border rounded-md overflow-hidden text-left mb-3"
      >
        <div className="p-3">
          <p className="text-[11px] uppercase tracking-wide text-secondaryText flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Check-in
          </p>
          <p className="text-sm font-medium mt-0.5">{fmt(checkIn)}</p>
        </div>
        <div className="p-3">
          <p className="text-[11px] uppercase tracking-wide text-secondaryText flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Check-out
          </p>
          <p className="text-sm font-medium mt-0.5">{fmt(checkOut)}</p>
        </div>
      </button>

      {/* Calendar */}
      {open && (
        <div className="border border-border rounded-md p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setCursor(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - 1, 1)))}
              disabled={cursor <= new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))}
              className="p-1.5 rounded hover:bg-warmWhite disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-xs text-secondaryText">
              {picking === "in" ? "Select check-in" : "Select check-out"}
            </p>
            <button
              onClick={() => setCursor(new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)))}
              className="p-1.5 rounded hover:bg-warmWhite"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {months.map((m) => (
              <div key={m.label}>
                <p className="text-xs font-medium text-center mb-1.5">{m.label}</p>
                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <span key={i} className="text-[10px] text-secondaryText py-0.5">{d}</span>
                  ))}
                  {m.cells.map((day, i) => {
                    if (!day) return <span key={i} />
                    const v = iso(day)
                    const past = day < today
                    const isIn = v === checkIn
                    const isOut = v === checkOut
                    const between = inRange(day)
                    return (
                      <button
                        key={i}
                        disabled={past}
                        onClick={() => pickDate(day)}
                        onMouseEnter={() => setHover(v)}
                        className={`h-7 text-[11px] rounded transition-colors ${
                          past
                            ? "text-secondaryText/40 cursor-not-allowed"
                            : isIn || isOut
                            ? "bg-stayoraTeal text-white font-semibold"
                            : between
                            ? "bg-stayoraTeal/15 text-deepOceanBlue"
                            : "hover:bg-warmWhite"
                        }`}
                      >
                        {day.getUTCDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
            <p className="text-[11px] text-secondaryText">
              {fmt(checkIn)} → {fmt(checkOut)}
            </p>
            <button onClick={() => setOpen(false)} className="text-xs text-stayoraTeal hover:underline">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Guests */}
      <div className="space-y-2 mb-3">
        <Stepper label="Rooms" value={rooms} min={1} max={4} onChange={(v) => {
          setRooms(v)
          if (adults > v * maxGuestsPerRoom) setAdults(v * maxGuestsPerRoom)
          if (children > Math.max(0, (maxGuestsPerRoom - 2) * v)) setChildren(Math.max(0, (maxGuestsPerRoom - 2) * v))
        }} />
        <Stepper label="Adults" value={adults} min={1} max={maxAdults} onChange={setAdults} hint="Age 13+" />
        <Stepper label="Children" value={children} min={0} max={maxChildren} onChange={setChildren} hint="Age 0–12" />
      </div>

      {overCapacity && (
        <p className="text-xs text-errorRed mb-2">
          {guests} guests exceeds {maxGuestsPerRoom * rooms} for {rooms} room{rooms === 1 ? "" : "s"}. Add a room.
        </p>
      )}

      <div className="border-t border-border pt-3 mb-3">
        <div className="flex justify-between text-sm">
          <span className="text-secondaryText">Estimated</span>
          <span className="font-semibold text-deepOceanBlue">
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(estimate)}
          </span>
        </div>
        <p className="text-[11px] text-secondaryText mt-0.5">
          Excluding taxes · final price shown on each room
        </p>
      </div>

      <Button
        onClick={apply}
        disabled={overCapacity || nights < 1}
        className="w-full bg-stayoraTeal hover:bg-stayoraTeal/90"
      >
        Update availability
      </Button>
      <p className="text-[11px] text-secondaryText text-center mt-2 flex items-center justify-center gap-1">
        <Users className="h-3 w-3" />
        Free cancellation up to 48h before check-in
      </p>
    </div>
  )
}

function Stepper({
  label, value, min, max, onChange, hint,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm">{label}</p>
        {hint && <p className="text-[11px] text-secondaryText">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-warmWhite disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="w-6 text-center text-sm font-medium tabular-nums">{value}</span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-warmWhite disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}
