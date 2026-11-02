import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireManager, audit } from "@/lib/permissions"

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  baseRate: z.number().positive().max(500000),
  maxOccupancy: z.number().int().min(1).max(12),
  maxAdults: z.number().int().min(1).max(12).optional(),
  maxChildren: z.number().int().min(0).max(8).optional(),
  bedConfiguration: z.string().min(2),
  size: z.string().optional(),
  roomCount: z.number().int().min(0).max(200).default(0),
  roomPrefix: z.string().optional(),
})

const DAYS = 180

export async function POST(
  req: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  return handle(async () => {
    const { hotelId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    await requireManager(user, hotelId)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid room type")
    }
    const d = parsed.data

    const existingNumbers = new Set(
      (await prisma.room.findMany({
        where: { hotelId },
        select: { roomNumber: true },
      })).map((r) => r.roomNumber)
    )

    const result = await prisma.$transaction(async (tx) => {
      const roomType = await tx.roomType.create({
        data: {
          hotelId,
          name: d.name,
          description: d.description,
          baseRate: d.baseRate,
          maxOccupancy: d.maxOccupancy,
          maxAdults: d.maxAdults ?? Math.min(2, d.maxOccupancy),
          maxChildren: d.maxChildren ?? 0,
          bedConfiguration: d.bedConfiguration,
          size: d.size ?? null,
        },
      })

      // Physical rooms
      const prefix = (d.roomPrefix ?? "").trim()
      let created = 0
      let i = 1
      while (created < d.roomCount && i <= d.roomCount + 999) {
        const candidate = prefix
          ? `${prefix}${String(i).padStart(2, "0")}`
          : `${String(i).padStart(3, "0")}`
        if (!existingNumbers.has(candidate)) {
          await tx.room.create({
            data: {
              hotelId,
              roomTypeId: roomType.id,
              roomNumber: candidate,
              status: "AVAILABLE",
              housekeepingStatus: "READY_FOR_ASSIGNMENT",
            },
          })
          existingNumbers.add(candidate)
          created++
        }
        i++
      }

      // Forward inventory so the room type is immediately bookable.
      const now = new Date()
      const rows = []
      for (let day = 0; day < DAYS; day++) {
        rows.push({
          roomTypeId: roomType.id,
          date: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + day)),
          totalRooms: created,
          available: created,
          blocked: 0,
        })
      }
      await tx.roomInventory.createMany({ data: rows })

      return { roomType, roomsCreated: created }
    })

    await audit(user.id, "roomtype.create", "RoomType", result.roomType.id, {
      hotelId, name: d.name, rooms: result.roomsCreated,
    })

    return ok({ id: result.roomType.id, roomsCreated: result.roomsCreated }, 201)
  })
}
