import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { computeAnalytics } from "@/lib/analytics"
import { Building2, CalendarCheck, IndianRupee, Percent, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OwnerOverview() {
  const user = await pageStaff("/owner")
  const hotels = await accessibleHotels(user)
  const hotelIds = hotels.map((h) => h.id)

  if (hotels.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center">
          <Building2 className="h-10 w-10 text-secondaryText mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-1">No properties yet</h2>
          <p className="text-secondaryText mb-5 text-sm">
            Add your first property to start receiving reservations.
          </p>
          <Link href="/owner/properties/new">
            <Button className="bg-stayoraTeal hover:bg-stayoraTeal/90">Add a property</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  const [analytics, upcoming] = await Promise.all([
    computeAnalytics(hotelIds),
    prisma.booking.findMany({
      where: { hotelId: { in: hotelIds }, status: { in: ["CONFIRMED", "CHECKED_IN"] } },
      include: { hotel: { select: { name: true } } },
      orderBy: { checkInDate: "asc" },
      take: 6,
    }),
  ])

  const stats = [
    { label: "Occupancy (next 30d)", value: `${analytics.occupancy}%`, icon: Percent },
    { label: "Gross booking value", value: formatCurrency(analytics.grossBookingValue), icon: IndianRupee },
    { label: "Collected", value: formatCurrency(analytics.collected), icon: IndianRupee },
    { label: "Reservations", value: String(analytics.totalBookings), icon: CalendarCheck },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <s.icon className="h-5 w-5 text-stayoraTeal mb-2" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-secondaryText">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">ADR</p>
            <p className="text-lg font-semibold">{formatCurrency(analytics.adr)}</p>
            <p className="text-xs text-secondaryText">Average daily rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">RevPAR</p>
            <p className="text-lg font-semibold">{formatCurrency(analytics.revpar)}</p>
            <p className="text-xs text-secondaryText">Revenue per available room</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Cancellation rate</p>
            <p className="text-lg font-semibold">{analytics.cancellationRate}%</p>
            <p className="text-xs text-secondaryText">{analytics.cancelledBookings} cancelled</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">Upcoming arrivals</CardTitle>
          <Link href="/owner/bookings" className="text-sm text-stayoraTeal hover:underline flex items-center gap-1">
            All bookings <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <p className="text-sm text-secondaryText">No upcoming arrivals.</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((b) => (
                <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 border border-border rounded-lg px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{b.guestName}</p>
                    <p className="text-xs text-secondaryText">
                      {b.hotel.name} · {b.bookingReference}
                    </p>
                  </div>
                  <div className="text-right">
                    <p>{formatDate(b.checkInDate)}</p>
                    <p className="text-xs text-secondaryText">
                      {b.numberOfNights} night{b.numberOfNights === 1 ? "" : "s"} · {b.numberOfRooms} room{b.numberOfRooms === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
