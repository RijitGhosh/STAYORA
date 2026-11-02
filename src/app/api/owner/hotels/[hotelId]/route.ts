import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireManager, audit } from "@/lib/permissions"

const schema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(20).optional(),
  address: z.string().min(3).optional(),
  cityId: z.string().optional(),
  pincode: z.string().min(4).optional(),
  phone: z.string().min(6).optional(),
  email: z.string().email().optional(),
  starRating: z.number().int().min(1).max(5).optional(),
  hotelType: z.enum(["LUXURY", "BUSINESS", "RESORT", "HERITAGE", "BUDGET"]).optional(),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  gstin: z.string().optional().nullable(),
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

    // Only owners and managers may edit property records.
    await requireManager(user, hotelId)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid details")
    }

    const d = parsed.data
    if (d.cityId) {
      const city = await prisma.city.findUnique({ where: { id: d.cityId } })
      if (!city) return fail("That city doesn't exist")
    }

    // Commission is a platform-level setting; only admins may change it.
    const data: any = { ...d }
    if (d.commissionRate !== undefined && user.role !== "ADMIN") delete data.commissionRate

    const hotel = await prisma.hotel.update({ where: { id: hotelId }, data })
    await audit(user.id, "hotel.update", "Hotel", hotel.id, d)

    return ok({ id: hotel.id, name: hotel.name })
  })
}
