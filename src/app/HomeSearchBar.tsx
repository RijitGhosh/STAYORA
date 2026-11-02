"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Search } from "lucide-react"

function isoIn(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function HomeSearchBar() {
  const router = useRouter()
  const [destination, setDestination] = useState("")
  const [checkIn, setCheckIn] = useState(isoIn(1))
  const [checkOut, setCheckOut] = useState(isoIn(3))
  const [rooms, setRooms] = useState("1")
  const [adults, setAdults] = useState("2")
  const [children, setChildren] = useState("0")

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const qs = new URLSearchParams({ checkIn, checkOut, rooms, adults, children })
    if (destination.trim()) qs.set("destination", destination.trim())
    router.push(`/search?${qs.toString()}`)
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-lg shadow-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-4">
          <label className="text-xs font-medium text-primaryText mb-1 block">Destination</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-secondaryText" />
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City, state, or hotel name"
              className="pl-9"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-primaryText mb-1 block">Check-in</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-secondaryText" />
            <Input type="date" value={checkIn} min={isoIn(0)} onChange={(e) => setCheckIn(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-primaryText mb-1 block">Check-out</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-secondaryText" />
            <Input type="date" value={checkOut} min={checkIn} onChange={(e) => setCheckOut(e.target.value)} className="pl-9" />
          </div>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-medium text-primaryText mb-1 block">Rooms</label>
          <select value={rooms} onChange={(e) => setRooms(e.target.value)} className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="md:col-span-1">
          <label className="text-xs font-medium text-primaryText mb-1 block">Adults</label>
          <select value={adults} onChange={(e) => setAdults(e.target.value)} className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white">
            {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <Button type="submit" className="w-full h-10 bg-stayoraTeal hover:bg-stayoraTeal/90">
            <Search className="h-4 w-4 mr-2" />
            Search hotels
          </Button>
        </div>
      </div>
    </form>
  )
}
