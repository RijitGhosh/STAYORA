import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getCurrentUser } from "@/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CheckCircle, Download, CalendarDays, MapPin } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params
  const user = await getCurrentUser()

  const booking = await prisma.booking.findUnique({
    where: { bookingReference: reference },
    include: {
      hotel: { include: { city: { include: { state: true } } } },
      items: { include: { roomType: true } },
      invoice: true,
    },
  })

  if (!booking) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">Booking not found</h1>
          <p className="text-secondaryText mb-6">
            We couldn&apos;t find a reservation with reference {reference}.
          </p>
          <Link href="/search"><Button>Search hotels</Button></Link>
        </div>
        <Footer />
      </div>
    )
  }

  const isOwner = user?.id === booking.userId
  const item = booking.items[0]

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <CheckCircle className="h-14 w-14 text-successGreen mx-auto mb-3" />
              <h1 className="text-2xl font-bold">Booking confirmed</h1>
              <p className="text-secondaryText">A confirmation has been recorded in your account.</p>
            </div>

            <div className="bg-warmWhite border border-border rounded-lg p-4 text-center mb-6">
              <p className="text-sm text-secondaryText">Booking reference</p>
              <p className="text-2xl font-bold text-stayoraTeal tracking-wide">{booking.bookingReference}</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-secondaryText">Hotel</span>
                <span className="font-medium text-right">{booking.hotel.name}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-secondaryText">Location</span>
                <span className="text-right">
                  {booking.hotel.city.name}, {booking.hotel.city.state.name}
                </span>
              </div>
              {item && (
                <div className="flex justify-between gap-4">
                  <span className="text-secondaryText">Room</span>
                  <span className="text-right">
                    {item.roomType.name} × {item.quantity}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-secondaryText">Dates</span>
                <span className="text-right">
                  {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-secondaryText">Nights</span>
                <span>{booking.numberOfNights}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-secondaryText">Guests</span>
                <span>
                  {booking.numberOfAdults} adult{booking.numberOfAdults === 1 ? "" : "s"}
                  {booking.numberOfChildren ? `, ${booking.numberOfChildren} child` : ""}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-secondaryText">Guest name</span>
                <span>{booking.guestName}</span>
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-secondaryText">Room charges</span>
                  <span>{formatCurrency(booking.roomCharges)}</span>
                </div>
                {booking.discounts > 0 && (
                  <div className="flex justify-between text-successGreen">
                    <span>Discount {booking.couponCode ? `(${booking.couponCode})` : ""}</span>
                    <span>−{formatCurrency(booking.discounts)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-secondaryText">GST</span>
                  <span>{formatCurrency(booking.taxes)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
                  <span>Total</span>
                  <span className="text-deepOceanBlue">{formatCurrency(booking.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              {isOwner && booking.outstandingAmount > 0 && (
                <Link href={`/bookings/${booking.id}/payment`} className="flex-1">
                  <Button className="w-full bg-coral hover:bg-coral/90">
                    Pay {formatCurrency(booking.outstandingAmount)}
                  </Button>
                </Link>
              )}
              {isOwner && (
                <>
                  <Link href={`/api/invoices/${booking.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download invoice
                    </Button>
                  </Link>
                  <Link href={`/account/bookings/${booking.id}`} className="flex-1">
                    <Button className="w-full bg-stayoraTeal hover:bg-stayoraTeal/90">
                      Manage booking
                    </Button>
                  </Link>
                </>
              )}
              {!isOwner && (
                <Link href="/search" className="flex-1">
                  <Button className="w-full">Search more hotels</Button>
                </Link>
              )}
            </div>

            <div className="flex flex-wrap gap-4 justify-center text-xs text-secondaryText mt-6">
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Free cancellation until 48h before check-in</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {booking.hotel.address}</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
