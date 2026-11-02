import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireAdmin, audit } from "@/lib/permissions"

const schema = z.object({
  role: z.enum(["CUSTOMER", "HOTEL_OWNER", "RECEPTIONIST", "HOUSEKEEPING", "FINANCE", "SUPPORT", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  return handle(async () => {
    const { userId } = await params
    const admin = await apiUser()
    if (!admin) return fail("Please sign in", 401)
    requireAdmin(admin)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Invalid change")

    const target = await prisma.user.findUnique({ where: { id: userId } })
    if (!target) return fail("User not found", 404)

    if (target.id === admin.id && parsed.data.role && parsed.data.role !== "ADMIN") {
      return fail("You can't remove your own administrator access")
    }
    if (target.id === admin.id && parsed.data.isActive === false) {
      return fail("You can't deactivate your own account")
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: parsed.data })
    await audit(admin.id, "user.update", "User", userId, {
      from: { role: target.role, isActive: target.isActive },
      to: parsed.data,
    })

    return ok({ id: updated.id, role: updated.role, isActive: updated.isActive })
  })
}
