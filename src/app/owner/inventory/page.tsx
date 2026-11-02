import { Card, CardContent } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import InventoryCalendar from "@/components/dashboard/InventoryCalendar"

export const dynamic = "force-dynamic"

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const user = await pageStaff("/owner/inventory")
  const hotels = await accessibleHotels(user)
  const hotelIds = hotels.map((h) => h.id)

  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId: { in: hotelIds } },
    include: { hotel: { select: { name: true } }, rooms: { select: { id: true } } },
    orderBy: [{ hotelId: "asc" }, { baseRate: "asc" }],
  })

  const selectedId = typeof sp.roomTypeId === "string" ? sp.roomTypeId : roomTypes[0]?.id
  const selected = roomTypes.find((r) => r.id === selectedId) ?? roomTypes[0]

  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const inventory = selected
    ? await prisma.roomInventory.findMany({
        where: { roomTypeId: selected.id, date: { gte: start } },
        orderBy: { date: "asc" },
        take: 60,
      })
    : []

  const bookingCounts = selected
    ? await prisma.bookingItem.findMany({
        where: {
          roomTypeId: selected.id,
          booking: { status: { in: ["CONFIRMED", "CHECKED_IN"] }, checkOutDate: { gte: start } },
        },
        include: { booking: { select: { checkInDate: true, checkOutDate: true, numberOfRooms: true } } },
      })
    : []

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Inventory</h2>
        <p className="text-sm text-secondaryText">
          Rooms you release to guests, by date. Blocking a room removes it from sale for that night.
          Bookings already confirmed keep their allocation.
        </p>
      </div>

      {roomTypes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-secondaryText">
          Add a room type first.
        </CardContent></Card>
      ) : (
        <InventoryCalendar
          roomTypes={roomTypes.map((r) => ({
            id: r.id,
            label: `${r.hotel.name} — ${r.name}`,
            totalRooms: r.rooms.length,
          }))}
          selectedId={selected!.id}
          days={inventory.map((i) => ({
            id: i.id,
            date: i.date.toISOString().slice(0, 10),
            totalRooms: i.totalRooms,
            available: i.available,
            blocked: i.blocked,
          }))}
          bookedNights={buildBookedMap(bookingCounts, start)}
        />
      )}
    </div>
  )
}

/** Count rooms held by confirmed bookings per night. */
function buildBookedMap(
  items: { quantity: number; booking: { checkInDate: Date; checkOutDate: Date; numberOfRooms: number } }[],
  from: Date
): Record<string, number> {
  const map: Record<string, number> = {}
  for (const item of items) {
    const cursor = new Date(item.booking.checkInDate)
    cursor.setUTCHours(0, 0, 0, 0)
    const end = new Date(item.booking.checkOutDate)
    end.setUTCHours(0, 0, 0, 0)
    while (cursor < end) {
      const key = cursor.toISOString().slice(0, 10)
      map[key] = (map[key] ?? 0) + item.quantity
      cursor.setUTCDate(cursor.getUTCDate() + 1)
    }
  }
  return map
}
