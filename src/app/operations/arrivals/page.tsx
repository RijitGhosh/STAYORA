import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ArrivalsPage() {
  const user = await pageStaff("/operations/arrivals")
  const hotels = await accessibleHotels(user)

  const arrivals = await prisma.booking.findMany({
    where: {
      hotelId: { in: hotels.map((h) => h.id) },
      status: "CONFIRMED",
    },
    include: {
      hotel: { select: { name: true } },
      items: { include: { roomType: { select: { name: true } } } },
    },
    orderBy: { checkInDate: "asc" },
    take: 100,
  })

  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Arrivals</h2>
        <p className="text-sm text-secondaryText">
          Confirmed reservations awaiting check-in. Check-in assigns a physical room and marks the
          booking in-house.
        </p>
      </div>

      {arrivals.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-secondaryText">
          No reservations are waiting to check in.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {arrivals.map((b) => {
            const isToday = b.checkInDate >= today && b.checkInDate < new Date(today.getTime() + 86_400_000)
            const isPast = b.checkInDate < today
            return (
              <Card key={b.id} className={isPast ? "border-warningAmber/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{b.guestName}</p>
                        {isToday && <span className="text-[11px] px-2 py-0.5 rounded-full bg-successGreen/10 text-successGreen">arriving today</span>}
                        {isPast && <span className="text-[11px] px-2 py-0.5 rounded-full bg-warningAmber/10 text-warningAmber">overdue arrival</span>}
                      </div>
                      <p className="text-xs text-secondaryText mt-0.5">
                        {b.bookingReference} · {b.hotel.name}
                      </p>
                      <p className="text-sm mt-1">
                        {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ·{" "}
                        {b.numberOfRooms} room{b.numberOfRooms === 1 ? "" : "s"} ·{" "}
                        {b.items.map((i) => i.roomType.name).join(", ")}
                      </p>
                      <p className="text-xs text-secondaryText mt-0.5">
                        {b.numberOfAdults} adult{b.numberOfAdults === 1 ? "" : "s"}
                        {b.numberOfChildren ? `, ${b.numberOfChildren} child` : ""} · {b.guestPhone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(b.totalAmount)}</p>
                      <p className="text-xs text-secondaryText mb-2">
                        {b.outstandingAmount > 0 ? `${formatCurrency(b.outstandingAmount)} due` : "Fully paid"}
                      </p>
                      <Link
                        href={`/operations/bookings/${b.id}`}
                        className="inline-block text-xs bg-stayoraTeal text-white px-3 py-1.5 rounded-md hover:bg-stayoraTeal/90"
                      >
                        Check in
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
