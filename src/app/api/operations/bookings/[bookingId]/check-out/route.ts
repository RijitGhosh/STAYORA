import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireOperations, audit } from "@/lib/permissions"

const schema = z.object({
  paymentAmount: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  return handle(async () => {
    const { bookingId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { items: { include: { room: true } }, additionalChargesList: true },
    })
    if (!booking) return fail("Booking not found", 404)

    await requireOperations(user, booking.hotelId)

    if (booking.status !== "CHECKED_IN") {
      return fail(`A ${booking.status.replace(/_/g, " ").toLowerCase()} booking can't be checked out`)
    }

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Invalid payment amount")
    const { paymentAmount, notes } = parsed.data

    const extras = booking.additionalChargesList.reduce((s, c) => s + c.amount, 0)
    const finalBill = booking.totalAmount + extras
    const totalPaid = booking.amountPaid + paymentAmount

    if (paymentAmount > finalBill - booking.amountPaid + 0.01) {
      return fail("Payment can't exceed the outstanding balance")
    }

    const roomIds = booking.items.map((i) => i.roomId).filter(Boolean) as string[]

    const result = await prisma.$transaction(async (tx) => {
      // Release the physical rooms and queue them for housekeeping.
      for (const roomId of roomIds) {
        await tx.room.update({
          where: { id: roomId },
          data: {
            status: "AVAILABLE",
            housekeepingStatus: "CLEANING_REQUIRED",
          },
        })
      }

      if (roomIds.length) {
        await tx.housekeepingTask.create({
          data: {
            hotelId: booking.hotelId,
            roomId: roomIds[0],
            status: "CLEANING_REQUIRED",
            priority: 1,
            notes: `Departure cleaning after ${booking.bookingReference}`,
          },
        })
      }

      await tx.checkOutRecord.create({
        data: {
          bookingId: booking.id,
          checkedOutBy: user.id,
          finalBillAmount: finalBill,
          notes: notes ?? null,
        },
      })

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CHECKED_OUT",
          checkedOutAt: new Date(),
          additionalCharges: extras,
          totalAmount: finalBill,
          amountPaid: totalPaid,
          outstandingAmount: Math.max(0, finalBill - totalPaid),
          statusHistory: {
            create: {
              status: "CHECKED_OUT",
              changedBy: user.id,
              notes: `Final bill ₹${finalBill.toFixed(0)}${paymentAmount ? `, collected ₹${paymentAmount.toFixed(0)}` : ""}`,
            },
          },
        },
      })
    })

    await audit(user.id, "booking.checkout", "Booking", booking.id, {
      finalBill, paymentAmount, extras,
    })

    return ok({ status: result.status, finalBill, paid: totalPaid })
  })
}
