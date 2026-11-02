import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireOperations, audit } from "@/lib/permissions"

const schema = z.object({
  roomId: z.string().min(1),
  depositAmount: z.number().min(0).nullable().optional(),
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
      include: { items: true },
    })
    if (!booking) return fail("Booking not found", 404)

    await requireOperations(user, booking.hotelId)

    if (booking.status !== "CONFIRMED") {
      return fail(`A ${booking.status.replace(/_/g, " ").toLowerCase()} booking can't be checked in`)
    }

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Assign a room to continue")
    const { roomId, depositAmount, notes } = parsed.data

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room || room.hotelId !== booking.hotelId) return fail("That room isn't in this property", 404)

    const item = booking.items[0]
    if (!item) return fail("This booking has no rooms")
    if (room.roomTypeId !== item.roomTypeId) {
      return fail(`Room ${room.roomNumber} isn't the booked room type`)
    }

    // The room must not be held by another overlapping reservation.
    const clash = await prisma.bookingItem.findFirst({
      where: {
        roomId: room.id,
        bookingId: { not: booking.id },
        booking: {
          status: { in: ["CONFIRMED", "CHECKED_IN"] },
          checkInDate: { lt: booking.checkOutDate },
          checkOutDate: { gt: booking.checkInDate },
        },
      },
    })
    if (clash) return fail(`Room ${room.roomNumber} is already assigned to another stay on these dates`)

    const result = await prisma.$transaction(async (tx) => {
      // Assign the physical room to the booking item.
      await tx.bookingItem.update({
        where: { id: item.id },
        data: { roomId: room.id },
      })

      await tx.room.update({
        where: { id: room.id },
        data: { status: "OCCUPIED" },
      })

      await tx.checkInRecord.create({
        data: {
          bookingId: booking.id,
          checkedInBy: user.id,
          roomAssigned: room.roomNumber,
          depositAmount: depositAmount ?? null,
          notes: notes ?? null,
        },
      })

      return tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "CHECKED_IN",
          checkedInAt: new Date(),
          statusHistory: {
            create: {
              status: "CHECKED_IN",
              changedBy: user.id,
              notes: `Room ${room.roomNumber} assigned${depositAmount ? `, deposit ₹${depositAmount}` : ""}`,
            },
          },
        },
      })
    })

    await audit(user.id, "booking.checkin", "Booking", booking.id, {
      room: room.roomNumber, depositAmount,
    })

    return ok({ status: result.status, room: room.roomNumber })
  })
}
