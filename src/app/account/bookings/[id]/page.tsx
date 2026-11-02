import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { canCancel } from "@/lib/booking-service"
import CancelBookingButton from "@/app/account/bookings/[id]/CancelBookingButton"
import { Download, MapPin, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?callbackUrl=/account/bookings/${id}`)

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      hotel: { include: { city: { include: { state: true } } } },
      items: { include: { roomType: true, room: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      invoice: true,
      additionalChargesList: true,
      payments: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!booking) notFound()
  if (booking.userId !== user.id) redirect("/account")

  const cancelCheck = canCancel(booking)
  const policy = (() => { try { return JSON.parse(booking.policySnapshot) } catch { return {} } })()

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/account" className="text-sm text-stayoraTeal hover:underline">← Back to account</Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mt-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{booking.hotel.name}</h1>
            <p className="text-secondaryText flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {booking.hotel.address}, {booking.hotel.city.name}, {booking.hotel.city.state.name}
            </p>
            <p className="text-sm text-secondaryText mt-2">
              Booking reference <span className="font-semibold text-stayoraTeal">{booking.bookingReference}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {booking.outstandingAmount > 0 && booking.status !== "CANCELLED" && (
              <Link href={`/bookings/${booking.id}/payment`}>
                <Button className="bg-coral hover:bg-coral/90">
                  Pay {formatCurrency(booking.outstandingAmount)}
                </Button>
              </Link>
            )}
            <Link href={`/api/invoices/${booking.id}`} target="_blank">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Invoice
              </Button>
            </Link>
            {cancelCheck.allowed && <CancelBookingButton bookingId={booking.id} />}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondaryText">Status</p>
              <p className="font-semibold">{booking.status.replace(/_/g, " ")}</p>
              {booking.status === "CANCELLED" && (
                <p className="text-xs text-errorRed mt-1">Refund: {booking.refundStatus.replace(/_/g, " ").toLowerCase()}</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondaryText">Dates</p>
              <p className="font-semibold">{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</p>
              <p className="text-xs text-secondaryText mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                In {booking.hotel.checkInTime} · Out {booking.hotel.checkOutTime}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-secondaryText">Total</p>
              <p className="font-semibold">{formatCurrency(booking.totalAmount)}</p>
              <p className="text-xs text-secondaryText">
                Paid {formatCurrency(booking.amountPaid)} · Due {formatCurrency(booking.outstandingAmount)}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Rooms & guests</CardTitle></CardHeader>
          <CardContent>
            {booking.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">{item.roomType.name} × {item.quantity}</p>
                  <p className="text-sm text-secondaryText">
                    {item.roomType.bedConfiguration}
                    {item.room ? ` · Room ${item.room.roomNumber}` : ""}
                  </p>
                </div>
                <p className="font-medium">{formatCurrency(item.totalAmount)}</p>
              </div>
            ))}
            <p className="text-sm text-secondaryText mt-3">
              {booking.numberOfAdults} adult{booking.numberOfAdults === 1 ? "" : "s"}
              {booking.numberOfChildren ? `, ${booking.numberOfChildren} child` : ""} ·{" "}
              {booking.numberOfNights} night{booking.numberOfNights === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Price breakdown</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Room charges" value={formatCurrency(booking.roomCharges + booking.discounts)} />
            {booking.discounts > 0 && (
              <Row label={`Discount${booking.couponCode ? ` (${booking.couponCode})` : ""}`} value={`−${formatCurrency(booking.discounts)}`} green />
            )}
            <Row label={`GST @ ${Math.round((policy.gstRate ?? 0.12) * 100)}%`} value={formatCurrency(booking.taxes)} />
            {booking.additionalCharges > 0 && (
              <Row label="Additional charges" value={formatCurrency(booking.additionalCharges)} />
            )}
            <div className="border-t border-border pt-2 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{formatCurrency(booking.totalAmount)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader><CardTitle className="text-lg">Guest & policies</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-2">
            <Row label="Guest" value={booking.guestName} />
            <Row label="Email" value={booking.guestEmail} />
            <Row label="Phone" value={booking.guestPhone} />
            <Row label="Cancellation" value={`Free until ${booking.cancellationDeadline ? formatDate(booking.cancellationDeadline) : "—"}`} />
            {!cancelCheck.allowed && booking.status !== "CANCELLED" && (
              <p className="text-errorRed text-xs mt-2">{cancelCheck.reason}</p>
            )}
          </CardContent>
        </Card>

        {booking.payments.length > 0 && (
          <Card className="mb-6">
            <CardHeader><CardTitle className="text-lg">Payments</CardTitle></CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {booking.payments.map((p) => (
                  <li key={p.id} className="py-2 flex justify-between gap-3 text-sm">
                    <div>
                      <p>{p.method?.replace(/_/g, " ") ?? "Payment"} · {formatCurrency(p.amount)}</p>
                      <p className="text-xs text-secondaryText">
                        {p.maskedReference ?? "—"} · {formatDate(p.createdAt)}
                        {p.failureReason ? ` · ${p.failureReason}` : ""}
                      </p>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full self-start ${
                      p.status === "CAPTURED" ? "bg-successGreen/10 text-successGreen"
                      : p.status === "FAILED" ? "bg-errorRed/10 text-errorRed"
                      : "bg-warningAmber/10 text-warningAmber"
                    }`}>{p.status}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle className="text-lg">History</CardTitle></CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {booking.statusHistory.map((h) => (
                <li key={h.id} className="flex gap-3 text-sm">
                  <span className="h-2 w-2 rounded-full bg-stayoraTeal mt-1.5 shrink-0" />
                  <div>
                    <p className="font-medium">{h.status.replace(/_/g, " ")}</p>
                    <p className="text-xs text-secondaryText">
                      {formatDate(h.createdAt)}{h.notes ? ` · ${h.notes}` : ""}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}

function Row({ label, value, green }: { label: string; value: string; green?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-secondaryText">{label}</span>
      <span className={green ? "text-successGreen" : ""}>{value}</span>
    </div>
  )
}
