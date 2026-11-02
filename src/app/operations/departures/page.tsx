import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function DeparturesPage() {
  const user = await pageStaff("/operations/departures")
  const hotels = await accessibleHotels(user)

  const inHouse = await prisma.booking.findMany({
    where: { hotelId: { in: hotels.map((h) => h.id) }, status: "CHECKED_IN" },
    include: {
      hotel: { select: { name: true } },
      items: { include: { roomType: { select: { name: true } }, room: { select: { roomNumber: true } } } },
      additionalChargesList: true,
      checkInRecord: true,
    },
    orderBy: { checkOutDate: "asc" },
  })

  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const tomorrow = new Date(today); tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Departures</h2>
        <p className="text-sm text-secondaryText">
          Guests currently in house. Check-out closes the folio, records payment taken at the desk,
          and sends the room to housekeeping.
        </p>
      </div>

      {inHouse.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-secondaryText">
          No guests are currently checked in.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {inHouse.map((b) => {
            const extras = b.additionalChargesList.reduce((s, c) => s + c.amount, 0)
            const dueToday = b.checkOutDate >= today && b.checkOutDate < tomorrow
            return (
              <Card key={b.id} className={dueToday ? "border-coral/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{b.guestName}</p>
                        {dueToday && <span className="text-[11px] px-2 py-0.5 rounded-full bg-coral/10 text-coral">departing today</span>}
                      </div>
                      <p className="text-xs text-secondaryText mt-0.5">
                        {b.bookingReference} · {b.hotel.name} ·{" "}
                        {b.items.map((i) => i.room?.roomNumber ? `Room ${i.room.roomNumber}` : i.roomType.name).join(", ")}
                      </p>
                      <p className="text-sm mt-1">
                        Departing {formatDate(b.checkOutDate)}
                        {b.checkInRecord ? ` · arrived ${new Date(b.checkInRecord.checkInTime).toLocaleDateString("en-IN")}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(b.totalAmount + extras)}</p>
                      <p className="text-xs text-secondaryText mb-2">
                        {formatCurrency(Math.max(0, b.totalAmount + extras - b.amountPaid))} due
                      </p>
                      <Link
                        href={`/operations/bookings/${b.id}`}
                        className="inline-block text-xs bg-coral text-white px-3 py-1.5 rounded-md hover:bg-coral/90"
                      >
                        Check out
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
