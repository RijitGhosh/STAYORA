import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { computeAnalytics } from "@/lib/analytics"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const user = await pageStaff("/owner/reports")
  const hotels = await accessibleHotels(user)
  const hotelIds = hotels.map((h) => h.id)

  const analytics = await computeAnalytics(hotelIds)

  const byRoomType = await prisma.bookingItem.groupBy({
    by: ["roomTypeId"],
    where: { booking: { hotelId: { in: hotelIds }, status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } } },
    _sum: { totalAmount: true, quantity: true },
    _count: true,
  })

  const roomTypes = await prisma.roomType.findMany({
    where: { id: { in: byRoomType.map((r) => r.roomTypeId) } },
    select: { id: true, name: true, hotel: { select: { name: true } } },
  })
  const rtMap = new Map(roomTypes.map((r) => [r.id, r]))

  const rows = byRoomType
    .map((r) => ({
      name: rtMap.get(r.roomTypeId)?.name ?? "—",
      hotel: rtMap.get(r.roomTypeId)?.hotel.name ?? "—",
      rooms: r._sum.quantity ?? 0,
      bookings: r._count,
      revenue: r._sum.totalAmount ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Reports</h2>
        <p className="text-sm text-secondaryText">
          Computed from reservations and inventory in the database. Nothing here is estimated.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Gross booking value", value: formatCurrency(analytics.grossBookingValue) },
          { label: "Collected", value: formatCurrency(analytics.collected) },
          { label: "Commission", value: formatCurrency(analytics.commission) },
          { label: "Refunded", value: formatCurrency(analytics.refunded) },
          { label: "Occupancy (30d)", value: `${analytics.occupancy}%` },
          { label: "ADR", value: formatCurrency(analytics.adr) },
          { label: "RevPAR", value: formatCurrency(analytics.revpar) },
          { label: "Cancellation rate", value: `${analytics.cancellationRate}%` },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm font-semibold">{s.value}</p>
              <p className="text-xs text-secondaryText">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Room type performance</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {rows.length === 0 ? (
            <p className="p-6 text-sm text-secondaryText">No reservations yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-deepOceanBlue text-white">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Room type</th>
                  <th className="text-left px-4 py-2.5 font-medium">Property</th>
                  <th className="text-right px-4 py-2.5 font-medium">Bookings</th>
                  <th className="text-right px-4 py-2.5 font-medium">Rooms sold</th>
                  <th className="text-right px-4 py-2.5 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5">{r.name}</td>
                    <td className="px-4 py-2.5 text-secondaryText">{r.hotel}</td>
                    <td className="px-4 py-2.5 text-right">{r.bookings}</td>
                    <td className="px-4 py-2.5 text-right">{r.rooms}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-secondaryText">
        Gross booking value counts confirmed, in-house and departed reservations. Collected reflects
        money actually recorded against bookings. Commission uses each property&apos;s configured rate.
      </p>
    </div>
  )
}
