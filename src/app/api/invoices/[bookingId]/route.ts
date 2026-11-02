import { NextResponse } from "next/server"
import { getCurrentUser } from "@/auth"
import { prisma } from "@/lib/prisma"
import { renderInvoiceHtml } from "@/lib/invoice"
import { invoiceNumber } from "@/lib/booking-service"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: "Please sign in" }, { status: 401 })
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      hotel: true,
      items: { include: { roomType: true } },
      invoice: true,
    },
  })

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  // Authorisation: the customer who booked it, the owning hotel's staff, or an admin.
  let allowed = booking.userId === user.id || user.role === "ADMIN"

  if (!allowed) {
    const membership = await prisma.hotelStaffMembership.findUnique({
      where: { hotelId_userId: { hotelId: booking.hotelId, userId: user.id } },
    })
    allowed = Boolean(membership) || booking.hotel.ownerId === user.id
  }

  if (!allowed) {
    return NextResponse.json({ error: "You don't have access to this invoice" }, { status: 403 })
  }

  // Persist an invoice record once, so the number is stable across downloads.
  if (!booking.invoice) {
    await prisma.invoice.create({
      data: {
        invoiceNumber: invoiceNumber(),
        bookingId: booking.id,
        hotelName: booking.hotel.name,
        hotelAddress: `${booking.hotel.address}, ${booking.hotel.pincode}`,
        hotelGstin: booking.hotel.gstin,
        guestName: booking.guestName,
        guestAddress: booking.guestEmail,
        subtotal: booking.roomCharges,
        taxes: booking.taxes,
        discounts: booking.discounts,
        additionalCharges: booking.additionalCharges,
        totalAmount: booking.totalAmount,
        amountPaid: booking.amountPaid,
        outstanding: booking.outstandingAmount,
        items: {
          create: booking.items.map((i) => ({
            description: `${i.roomType.name} × ${i.quantity} for ${booking.numberOfNights} night(s)`,
            quantity: i.quantity,
            rate: i.ratePerNight,
            amount: i.totalAmount,
          })),
        },
      },
    })
  }

  const fresh = await prisma.booking.findUnique({
    where: { id: booking.id },
    include: { hotel: true, items: { include: { roomType: true } }, invoice: true },
  })

  const html = renderInvoiceHtml(fresh as any)

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="invoice-${booking.bookingReference}.html"`,
      "Cache-Control": "no-store",
    },
  })
}
