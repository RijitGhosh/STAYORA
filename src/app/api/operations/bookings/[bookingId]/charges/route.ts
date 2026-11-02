import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireOperations, audit } from "@/lib/permissions"

const schema = z.object({
  description: z.string().min(2).max(120),
  amount: z.number().positive().max(500000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  return handle(async () => {
    const { bookingId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return fail("Booking not found", 404)

    await requireOperations(user, booking.hotelId)

    if (booking.status === "CHECKED_OUT" || booking.status === "CANCELLED") {
      return fail("This folio is closed")
    }

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid charge")

    const charge = await prisma.additionalCharge.create({
      data: {
        bookingId,
        description: parsed.data.description,
        amount: parsed.data.amount,
        addedBy: user.id,
      },
    })

    await audit(user.id, "booking.charge", "Booking", bookingId, parsed.data)

    return ok({ id: charge.id, amount: charge.amount }, 201)
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  return handle(async () => {
    const { bookingId } = await params
    const chargeId = new URL(req.url).searchParams.get("chargeId")
    if (!chargeId) return fail("Missing charge id")

    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return fail("Booking not found", 404)

    await requireOperations(user, booking.hotelId)

    if (booking.status === "CHECKED_OUT" || booking.status === "CANCELLED") {
      return fail("This folio is closed")
    }

    const charge = await prisma.additionalCharge.findUnique({ where: { id: chargeId } })
    if (!charge || charge.bookingId !== bookingId) return fail("Charge not found", 404)

    await prisma.additionalCharge.delete({ where: { id: chargeId } })
    await audit(user.id, "booking.charge.remove", "Booking", bookingId, {
      description: charge.description, amount: charge.amount,
    })

    return ok()
  })
}
