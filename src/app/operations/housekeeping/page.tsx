import { Card, CardContent } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import HousekeepingBoard from "@/components/operations/HousekeepingBoard"

export const dynamic = "force-dynamic"

export default async function HousekeepingPage() {
  const user = await pageStaff("/operations/housekeeping")
  const hotels = await accessibleHotels(user)
  const hotelIds = hotels.map((h) => h.id)

  const [rooms, tasks, staff] = await Promise.all([
    prisma.room.findMany({
      where: { hotelId: { in: hotelIds } },
      include: { roomType: { select: { name: true } } },
      orderBy: [{ hotelId: "asc" }, { roomNumber: "asc" }],
    }),
    prisma.housekeepingTask.findMany({
      where: { hotelId: { in: hotelIds }, status: { not: "READY_FOR_ASSIGNMENT" } },
      include: { room: { select: { roomNumber: true } } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { role: { in: ["HOUSEKEEPING", "RECEPTIONIST", "ADMIN"] } },
          { staffMemberships: { some: { hotelId: { in: hotelIds } } } },
        ],
      },
      select: { id: true, name: true, role: true },
    }),
  ])

  const hotelMap = new Map(hotels.map((h) => [h.id, h.name]))

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Housekeeping</h2>
        <p className="text-sm text-secondaryText">
          Cleaning status is tracked separately from availability. A room can be sellable but still
          need cleaning before the next guest arrives.
        </p>
      </div>

      <HousekeepingBoard
        rooms={rooms.map((r) => ({
          id: r.id,
          roomNumber: r.roomNumber,
          roomType: r.roomType.name,
          hotelName: hotelMap.get(r.hotelId) ?? "",
          status: r.status,
          housekeepingStatus: r.housekeepingStatus,
        }))}
        tasks={tasks.map((t) => ({
          id: t.id,
          room: t.room.roomNumber,
          status: t.status,
          priority: t.priority,
          assignedTo: t.assignedTo,
          notes: t.notes,
        }))}
        staff={staff.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  )
}
