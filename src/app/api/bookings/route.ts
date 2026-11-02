import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/auth"
import { createBooking, BookingError } from "@/lib/booking-service"

const schema = z.object({
  hotelId: z.string().min(1),
  roomTypeId: z.string().min(1),
  checkIn: z.string().min(8),
  checkOut: z.string().min(8),
  rooms: z.number().int().min(1).max(4),
  adults: z.number().int().min(1).max(12),
  children: z.number().int().min(0).max(8),
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(8),
  couponCode: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Please sign in to book" }, { status: 401 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking details" },
      { status: 400 }
    )
  }

  const d = parsed.data
  const checkIn = new Date(`${d.checkIn}T00:00:00.000Z`)
  const checkOut = new Date(`${d.checkOut}T00:00:00.000Z`)

  try {
    const booking = await createBooking({
      userId: user.id,
      hotelId: d.hotelId,
      roomTypeId: d.roomTypeId,
      checkIn,
      checkOut,
      rooms: d.rooms,
      adults: d.adults,
      children: d.children,
      guestName: d.guestName,
      guestEmail: d.guestEmail,
      guestPhone: d.guestPhone,
      couponCode: d.couponCode ?? null,
    })

    return NextResponse.json(
      { bookingId: booking.id, bookingReference: booking.bookingReference, total: booking.totalAmount },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof BookingError) {
      const status = e.code === "NO_INVENTORY" ? 409 : 400
      return NextResponse.json({ error: e.message, code: e.code }, { status })
    }
    console.error("Booking failed:", e)
    return NextResponse.json({ error: "We couldn't complete this booking" }, { status: 500 })
  }
}
