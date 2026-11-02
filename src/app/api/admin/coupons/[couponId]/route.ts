import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireAdmin, audit } from "@/lib/permissions"

const schema = z.object({
  isActive: z.boolean().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ couponId: string }> }
) {
  return handle(async () => {
    const { couponId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)
    requireAdmin(user)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Invalid change")

    const coupon = await prisma.coupon.findUnique({ where: { id: couponId } })
    if (!coupon) return fail("Coupon not found", 404)

    if (parsed.data.usageLimit != null && parsed.data.usageLimit < coupon.usedCount) {
      return fail(`This coupon has already been redeemed ${coupon.usedCount} times`)
    }

    const updated = await prisma.coupon.update({ where: { id: couponId }, data: parsed.data })
    await audit(user.id, "coupon.update", "Coupon", couponId, parsed.data)

    return ok({ id: updated.id, isActive: updated.isActive })
  })
}
