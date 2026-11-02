import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireAdmin, audit } from "@/lib/permissions"

const schema = z.object({
  code: z.string().min(3).max(24).regex(/^[A-Z0-9]+$/, "Use letters and numbers only"),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().positive(),
  minBookingAmount: z.number().min(0).nullable().optional(),
  maxDiscount: z.number().min(0).nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  perUserLimit: z.number().int().min(1).max(20),
  validDays: z.number().int().min(1).max(730),
})

export async function POST(req: Request) {
  return handle(async () => {
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)
    requireAdmin(user)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid coupon")
    const d = parsed.data

    if (d.type === "PERCENTAGE" && d.value > 100) return fail("Percentage can't exceed 100")

    const existing = await prisma.coupon.findUnique({ where: { code: d.code } })
    if (existing) return fail("That coupon code already exists")

    const now = new Date()
    const coupon = await prisma.coupon.create({
      data: {
        code: d.code,
        type: d.type,
        value: d.value,
        minBookingAmount: d.minBookingAmount ?? null,
        maxDiscount: d.maxDiscount ?? null,
        usageLimit: d.usageLimit ?? null,
        perUserLimit: d.perUserLimit,
        validFrom: now,
        validTo: new Date(now.getTime() + d.validDays * 86_400_000),
        isActive: true,
      },
    })

    await audit(user.id, "coupon.create", "Coupon", coupon.id, d)
    return ok({ id: coupon.id, code: coupon.code }, 201)
  })
}
