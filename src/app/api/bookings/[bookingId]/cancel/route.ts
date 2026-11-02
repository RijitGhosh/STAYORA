import { NextResponse } from "next/server"
import { getCurrentUser } from "@/auth"
import { cancelBooking, BookingError } from "@/lib/booking-service"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: "Please sign in" }, { status: 401 })

  try {
    const booking = await cancelBooking(bookingId, user.id, "Cancelled by guest")
    return NextResponse.json({ success: true, status: booking.status })
  } catch (e) {
    if (e instanceof BookingError) {
      const status = e.code === "FORBIDDEN" ? 403 : e.code === "NOT_FOUND" ? 404 : 400
      return NextResponse.json({ error: e.message }, { status })
    }
    console.error("Cancel failed:", e)
    return NextResponse.json({ error: "Couldn't cancel this booking" }, { status: 500 })
  }
}
