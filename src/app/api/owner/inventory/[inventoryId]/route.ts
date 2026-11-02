import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireManager, audit } from "@/lib/permissions"

const schema = z.object({
  available: z.number().int().min(0).max(1000),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ inventoryId: string }> }
) {
  return handle(async () => {
    const { inventoryId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const row = await prisma.roomInventory.findUnique({
      where: { id: inventoryId },
      include: { roomType: { select: { hotelId: true, name: true } } },
    })
    if (!row) return fail("Inventory row not found", 404)

    await requireManager(user, row.roomType.hotelId)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Invalid value")

    const { available } = parsed.data
    if (available > row.totalRooms) {
      return fail(`Available can't exceed ${row.totalRooms} rooms for this date`)
    }

    // Never allow inventory to drop below rooms already committed to bookings.
    const bookedItems = await prisma.bookingItem.findMany({
      where: {
        roomTypeId: row.roomTypeId,
        booking: {
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          checkInDate: { lte: row.date },
          checkOutDate: { gt: row.date },
        },
      },
      select: { quantity: true },
    })
    const committed = bookedItems.reduce((s, i) => s + i.quantity, 0)

    if (available < committed) {
      return fail(
        `${committed} room(s) are already booked on this date; availability can't go below that`
      )
    }

    const updated = await prisma.roomInventory.update({
      where: { id: inventoryId },
      data: { available },
    })

    await audit(user.id, "inventory.update", "RoomInventory", inventoryId, {
      date: row.date, from: row.available, to: available,
    })

    return ok({ id: updated.id, available: updated.available })
  })
}
