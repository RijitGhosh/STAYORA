import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import { CalendarCheck, CalendarX, BedDouble, Sparkles, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function FrontDeskPage() {
  const user = await pageStaff("/operations")
  const hotels = await accessibleHotels(user)
  const hotelIds = hotels.map((h) => h.id)

  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const tomorrow = new Date(today); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

  const [arrivals, inHouse, departures, dirtyRooms] = await Promise.all([
    prisma.booking.count({
      where: { hotelId: { in: hotelIds }, status: "CONFIRMED", checkInDate: { gte: today, lt: tomorrow } },
    }),
    prisma.booking.count({
      where: { hotelId: { in: hotelIds }, status: "CHECKED_IN" },
    }),
    prisma.booking.count({
      where: { hotelId: { in: hotelIds }, status: "CHECKED_IN", checkOutDate: { gte: today, lt: tomorrow } },
    }),
    prisma.room.count({
      where: {
        hotelId: { in: hotelIds },
        housekeepingStatus: { in: ["CLEANING_REQUIRED", "DIRTY", "CLEANING_IN_PROGRESS"] },
      },
    }),
  ])

  const arrivingToday = await prisma.booking.findMany({
    where: { hotelId: { in: hotelIds }, status: "CONFIRMED", checkInDate: { gte: today, lt: tomorrow } },
    include: { hotel: { select: { name: true } }, items: { include: { roomType: { select: { name: true } } } } },
    orderBy: { guestName: "asc" },
    take: 8,
  })

  const cards = [
    { href: "/operations/arrivals", label: "Arrivals today", value: arrivals, icon: CalendarCheck, tone: "text-successGreen" },
    { href: "/operations/departures", label: "Departures today", value: departures, icon: CalendarX, tone: "text-coral" },
    { href: "/operations/rooms", label: "In house", value: inHouse, icon: BedDouble, tone: "text-stayoraTeal" },
    { href: "/operations/housekeeping", label: "Rooms to clean", value: dirtyRooms, icon: Sparkles, tone: "text-warningAmber" },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.href} href={c.href}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <c.icon className={`h-5 w-5 mb-2 ${c.tone}`} />
                <p className="text-2xl font-bold">{c.value}</p>
                <p className="text-xs text-secondaryText">{c.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Arriving today</CardTitle>
          <Link href="/operations/arrivals" className="text-sm text-stayoraTeal hover:underline flex items-center gap-1">
            Check in <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {arrivingToday.length === 0 ? (
            <p className="text-sm text-secondaryText">No arrivals scheduled for today.</p>
          ) : (
            <div className="space-y-2">
              {arrivingToday.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border border-border rounded-lg px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{b.guestName}</p>
                    <p className="text-xs text-secondaryText">
                      {b.hotel.name} · {b.items.map((i) => i.roomType.name).join(", ")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-secondaryText">{b.bookingReference}</p>
                    <Link href={`/operations/bookings/${b.id}`} className="text-xs text-stayoraTeal hover:underline">
                      Check in →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {hotels.length > 1 && (
        <p className="text-xs text-secondaryText">
          Showing {hotels.length} properties: {hotels.map((h) => h.name).join(", ")}
        </p>
      )}
    </div>
  )
}
