"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Users, Search } from "lucide-react"

function isoIn(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function SearchBar() {
  const router = useRouter()
  const sp = useSearchParams()

  const [destination, setDestination] = useState(sp.get("destination") ?? "")
  const [checkIn, setCheckIn] = useState(sp.get("checkIn") ?? isoIn(1))
  const [checkOut, setCheckOut] = useState(sp.get("checkOut") ?? isoIn(3))
  const [rooms, setRooms] = useState(sp.get("rooms") ?? "1")
  const [adults, setAdults] = useState(sp.get("adults") ?? "2")
  const [children, setChildren] = useState(sp.get("children") ?? "0")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const qs = new URLSearchParams()
    if (destination.trim()) qs.set("destination", destination.trim())
    qs.set("checkIn", checkIn)
    qs.set("checkOut", checkOut)
    qs.set("rooms", rooms)
    qs.set("adults", adults)
    qs.set("children", children)
    router.push(`/search?${qs.toString()}`)
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-lg p-3 grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
      <div className="md:col-span-2">
        <label className="text-xs text-primaryText font-medium mb-1 block">Destination</label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 h-4 w-4 text-secondaryText" />
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="City, state or hotel name"
            className="pl-9"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-primaryText font-medium mb-1 block">Check-in</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-secondaryText" />
          <Input type="date" value={checkIn} min={isoIn(0)} onChange={(e) => setCheckIn(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div>
        <label className="text-xs text-primaryText font-medium mb-1 block">Check-out</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 h-4 w-4 text-secondaryText" />
          <Input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} className="pl-9" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1">
        <div>
          <label className="text-xs text-primaryText font-medium mb-1 block">Rooms</label>
          <select value={rooms} onChange={(e) => setRooms(e.target.value)} className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-primaryText font-medium mb-1 block">Adults</label>
          <select value={adults} onChange={(e) => setAdults(e.target.value)} className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-primaryText font-medium mb-1 block">Kids</label>
          <select value={children} onChange={(e) => setChildren(e.target.value)} className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
            {[0, 1, 2, 3].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      <Button type="submit" className="h-10 bg-stayoraTeal hover:bg-stayoraTeal/90">
        <Search className="h-4 w-4 mr-2" />
        Search
      </Button>
    </form>
  )
}
