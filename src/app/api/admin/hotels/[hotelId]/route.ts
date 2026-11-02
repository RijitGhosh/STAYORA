import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireAdmin, audit } from "@/lib/permissions"

const schema = z.object({
  status: z.enum(["APPROVED", "PENDING_APPROVAL", "SUSPENDED", "REJECTED", "INACTIVE"]).optional(),
  commissionRate: z.number().min(0).max(50).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  return handle(async () => {
    const { hotelId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)
    requireAdmin(user)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Invalid change")

    const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } })
    if (!hotel) return fail("Hotel not found", 404)

    // A property with no sellable rooms shouldn't become bookable.
    if (parsed.data.status === "APPROVED") {
      const sellable = await prisma.roomType.count({
        where: { hotelId, isActive: true, rooms: { some: {} } },
      })
      if (sellable === 0) {
        return fail("Add at least one active room type with physical rooms before approving")
      }
    }

    const updated = await prisma.hotel.update({
      where: { id: hotelId },
      data: parsed.data,
    })

    await audit(user.id, `hotel.${updated.status.toLowerCase()}`, "Hotel", hotelId, {
      from: hotel.status, to: updated.status,
    })

    return ok({ id: updated.id, status: updated.status })
  })
}
