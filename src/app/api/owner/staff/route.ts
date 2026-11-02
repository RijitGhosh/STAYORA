import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireManager, audit } from "@/lib/permissions"

const schema = z.object({
  hotelId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["MANAGER", "RECEPTION", "HOUSEKEEPING", "FINANCE"]),
})

export async function POST(req: Request) {
  return handle(async () => {
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Choose a property, person and role")
    const { hotelId, userId, role } = parsed.data

    await requireManager(user, hotelId)

    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target) return fail("That user doesn't exist", 404)
    if (target.id === user.id) return fail("You already have full access as owner")

    const membership = await prisma.hotelStaffMembership.upsert({
      where: { hotelId_userId: { hotelId, userId } },
      update: { role },
      create: { hotelId, userId, role },
    })

    await audit(user.id, "staff.grant", "HotelStaffMembership", membership.id, { hotelId, userId, role })

    return ok({ id: membership.id, role: membership.role }, 201)
  })
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const id = new URL(req.url).searchParams.get("id")
    if (!id) return fail("Missing membership id")

    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const membership = await prisma.hotelStaffMembership.findUnique({ where: { id } })
    if (!membership) return fail("Not found", 404)

    await requireManager(user, membership.hotelId)

    await prisma.hotelStaffMembership.delete({ where: { id } })
    await audit(user.id, "staff.revoke", "HotelStaffMembership", id, {
      hotelId: membership.hotelId, userId: membership.userId,
    })

    return ok()
  })
}
