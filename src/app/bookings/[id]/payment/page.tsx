import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentUser } from "@/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { isSandboxMode } from "@/lib/payments"
import PaymentForm from "@/app/bookings/[id]/payment/PaymentForm"
import { ShieldCheck, AlertTriangle } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/login?callbackUrl=/bookings/${id}/payment`)

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      hotel: { include: { city: true } },
      items: { include: { roomType: true } },
      payments: { orderBy: { createdAt: "desc" } },
    },
  })

  if (!booking) notFound()
  if (booking.userId !== user.id) redirect("/access-denied")

  const outstanding = Math.max(0, booking.totalAmount - booking.amountPaid)
  const sandbox = isSandboxMode()

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href={`/account/bookings/${booking.id}`} className="text-sm text-stayoraTeal hover:underline">
          ← Back to booking
        </Link>

        <h1 className="text-2xl font-bold mt-2 mb-1">Complete your payment</h1>
        <p className="text-sm text-secondaryText mb-6">
          Booking {booking.bookingReference} · {booking.hotel.name}, {booking.hotel.city.name}
        </p>

        {sandbox && (
          <div className="mb-5 rounded-lg border border-warningAmber/40 bg-warningAmber/10 p-4 text-sm">
            <p className="font-medium text-warningAmber flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Sandbox mode — no money moves
            </p>
            <p className="text-secondaryText mt-1">
              Razorpay keys are not configured, so payments are simulated locally. Any reference
              containing <code className="text-xs">fail</code>, or PIN <code className="text-xs">0000</code>,
              is declined so you can test the failure path. Add <code className="text-xs">RAZORPAY_KEY_ID</code> and{" "}
              <code className="text-xs">RAZORPAY_KEY_SECRET</code> to <code className="text-xs">.env</code> for the real gateway.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {outstanding <= 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShieldCheck className="h-10 w-10 text-successGreen mx-auto mb-3" />
                  <h2 className="font-semibold mb-1">Paid in full</h2>
                  <p className="text-sm text-secondaryText">
                    This booking has nothing outstanding.
                  </p>
                  <Link href={`/account/bookings/${booking.id}`} className="inline-block mt-4 text-sm text-stayoraTeal hover:underline">
                    View booking →
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <PaymentForm
                bookingId={booking.id}
                outstanding={outstanding}
                sandbox={sandbox}
                previousPayments={booking.payments.map((p) => ({
                  id: p.id,
                  status: p.status,
                  method: p.method ?? "",
                  amount: p.amount,
                  reference: p.maskedReference,
                  failureReason: p.failureReason,
                  createdAt: p.createdAt.toISOString(),
                }))}
              />
            )}
          </div>

          <aside>
            <Card className="sticky top-4">
              <CardContent className="p-5">
                <h2 className="font-semibold mb-3">Booking summary</h2>
                <div className="space-y-2 text-sm">
                  <Row label="Hotel" value={booking.hotel.name} />
                  <Row label="Room" value={booking.items.map((i) => `${i.roomType.name} × ${i.quantity}`).join(", ")} />
                  <Row label="Check-in" value={formatDate(booking.checkInDate)} />
                  <Row label="Check-out" value={formatDate(booking.checkOutDate)} />
                  <Row label="Nights" value={String(booking.numberOfNights)} />
                </div>

                <div className="border-t border-border mt-3 pt-3 space-y-2 text-sm">
                  <Row label="Room charges" value={formatCurrency(booking.roomCharges)} />
                  {booking.discounts > 0 && (
                    <Row label="Discount" value={`−${formatCurrency(booking.discounts)}`} />
                  )}
                  <Row label="GST" value={formatCurrency(booking.taxes)} />
                  <div className="flex justify-between font-semibold border-t border-border pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(booking.totalAmount)}</span>
                  </div>
                  <Row label="Already paid" value={formatCurrency(booking.amountPaid)} />
                  <div className="flex justify-between font-semibold text-stayoraTeal">
                    <span>Amount due</span>
                    <span>{formatCurrency(outstanding)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
      <Footer />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-secondaryText">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}
