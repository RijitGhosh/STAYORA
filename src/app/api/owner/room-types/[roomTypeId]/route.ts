import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireManager, audit } from "@/lib/permissions"

const schema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  baseRate: z.number().positive().max(500000).optional(),
  maxOccupancy: z.number().int().min(1).max(12).optional(),
  maxAdults: z.number().int().min(1).max(12).optional(),
  maxChildren: z.number().int().min(0).max(8).optional(),
  bedConfiguration: z.string().min(2).optional(),
  size: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomTypeId: string }> }
) {
  return handle(async () => {
    const { roomTypeId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const existing = await prisma.roomType.findUnique({ where: { id: roomTypeId } })
    if (!existing) return fail("Room type not found", 404)

    await requireManager(user, existing.hotelId)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid details")

    // Occupancy can never exceed the room's configured maximum.
    if (
      parsed.data.maxOccupancy !== undefined &&
      parsed.data.maxAdults !== undefined &&
      parsed.data.maxAdults > parsed.data.maxOccupancy
    ) {
      return fail("Max adults can't exceed max occupancy")
    }

    const updated = await prisma.roomType.update({
      where: { id: roomTypeId },
      data: parsed.data,
    })

    await audit(user.id, "roomtype.update", "RoomType", roomTypeId, parsed.data)

    return ok({ id: updated.id, name: updated.name, baseRate: updated.baseRate })
  })
}
