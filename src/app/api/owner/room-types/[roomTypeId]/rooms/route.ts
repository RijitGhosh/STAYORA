import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireManager, audit } from "@/lib/permissions"

const schema = z.object({
  count: z.number().int().min(1).max(50).default(1),
  prefix: z.string().optional(),
})

/** Add physical rooms to an existing room type, and raise forward inventory to match. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ roomTypeId: string }> }
) {
  return handle(async () => {
    const { roomTypeId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } })
    if (!roomType) return fail("Room type not found", 404)

    await requireManager(user, roomType.hotelId)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Invalid request")
    const { count } = parsed.data

    const taken = new Set(
      (await prisma.room.findMany({ where: { hotelId: roomType.hotelId }, select: { roomNumber: true } }))
        .map((r) => r.roomNumber)
    )

    const added = await prisma.$transaction(async (tx) => {
      let created = 0
      let i = 1
      while (created < count && i < count + 2000) {
        const number = `${String(i).padStart(3, "0")}`
        if (!taken.has(number)) {
          await tx.room.create({
            data: {
              hotelId: roomType.hotelId,
              roomTypeId,
              roomNumber: number,
              status: "AVAILABLE",
              housekeepingStatus: "READY_FOR_ASSIGNMENT",
            },
          })
          taken.add(number)
          created++
        }
        i++
      }

      // Raise inventory for every future date by the number of rooms added.
      const now = new Date()
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
      const future = await tx.roomInventory.findMany({
        where: { roomTypeId, date: { gte: today } },
        select: { id: true, totalRooms: true },
      })

      for (const row of future) {
        await tx.roomInventory.update({
          where: { id: row.id },
          data: { totalRooms: row.totalRooms + created, available: { increment: created } },
        })
      }

      return created
    })

    await audit(user.id, "room.create", "RoomType", roomTypeId, { added })

    return ok({ roomsAdded: added }, 201)
  })
}
