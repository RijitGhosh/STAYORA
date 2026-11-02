import { Card, CardContent } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import RoomBoard from "@/components/operations/RoomBoard"

export const dynamic = "force-dynamic"

export default async function RoomsPage() {
  const user = await pageStaff("/operations/rooms")
  const hotels = await accessibleHotels(user)
  const hotelIds = hotels.map((h) => h.id)

  const rooms = await prisma.room.findMany({
    where: { hotelId: { in: hotelIds } },
    include: {
      roomType: { select: { name: true } },
      bookings: {
        where: { booking: { status: "CHECKED_IN" } },
        include: { booking: { select: { guestName: true, checkOutDate: true, bookingReference: true } } },
        take: 1,
      },
    },
    orderBy: [{ hotelId: "asc" }, { roomNumber: "asc" }],
  })

  const hotelMap = new Map(hotels.map((h) => [h.id, h.name]))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Room board</h2>
        <p className="text-sm text-secondaryText">
          Physical rooms with occupancy and housekeeping state. Take a room out of service for
          maintenance without affecting bookings already on it.
        </p>
      </div>

      <RoomBoard
        rooms={rooms.map((r) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          roomType: r.roomType.name,
          hotelName: hotelMap.get(r.hotelId) ?? "",
          status: r.status,
          housekeepingStatus: r.housekeepingStatus,
          guest: r.bookings[0]?.booking.guestName ?? null,
          departure: r.bookings[0]?.booking.checkOutDate.toISOString() ?? null,
        }))}
      />
    </div>
  )
}
