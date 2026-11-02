import { redirect } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCurrentUser } from "@/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { CalendarDays, CreditCard, Heart, FileText, MapPin, Download } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-successGreen/10 text-successGreen border-successGreen/30",
  CHECKED_IN: "bg-stayoraTeal/10 text-stayoraTeal border-stayoraTeal/30",
  CHECKED_OUT: "bg-secondaryText/10 text-secondaryText border-border",
  CANCELLED: "bg-errorRed/10 text-errorRed border-errorRed/30",
  PENDING_PAYMENT: "bg-warningAmber/10 text-warningAmber border-warningAmber/30",
}

export default async function AccountPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login?callbackUrl=/account")

  const [bookings, favoritesCount] = await Promise.all([
    prisma.booking.findMany({
      where: { userId: user.id },
      include: {
        hotel: { include: { city: true } },
        items: { include: { roomType: true } },
        invoice: true,
      },
      orderBy: { checkInDate: "desc" },
    }),
    prisma.favoriteHotel.count({ where: { userId: user.id } }),
  ])

  const today = new Date()
  const upcoming = bookings.filter(
    (b) => ["CONFIRMED", "CHECKED_IN"].includes(b.status) && new Date(b.checkOutDate) >= today
  )
  const past = bookings.filter(
    (b) => b.status === "CHECKED_OUT" || (b.status === "CONFIRMED" && new Date(b.checkOutDate) < today)
  )
  const cancelled = bookings.filter((b) => b.status === "CANCELLED")
  const totalSpent = bookings
    .filter((b) => b.status !== "CANCELLED")
    .reduce((s, b) => s + b.amountPaid, 0)

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="text-secondaryText">{user.email}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <CalendarDays className="h-5 w-5 text-stayoraTeal mb-2" />
              <p className="text-2xl font-bold">{upcoming.length}</p>
              <p className="text-sm text-secondaryText">Upcoming stays</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <CreditCard className="h-5 w-5 text-coral mb-2" />
              <p className="text-2xl font-bold">{bookings.length}</p>
              <p className="text-sm text-secondaryText">All bookings</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <FileText className="h-5 w-5 text-warningAmber mb-2" />
              <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
              <p className="text-sm text-secondaryText">Total spent</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <Heart className="h-5 w-5 text-coral mb-2" />
              <p className="text-2xl font-bold">{favoritesCount}</p>
              <p className="text-sm text-secondaryText">Saved hotels</p>
            </CardContent>
          </Card>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-lg font-semibold mb-2">No bookings yet</h2>
              <p className="text-secondaryText mb-5">
                Search across {""}
                <span className="font-medium">83 hotels in 32 Indian cities</span> to plan your next stay.
              </p>
              <Link href="/search"><Button className="bg-stayoraTeal hover:bg-stayoraTeal/90">Find hotels</Button></Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Upcoming stays</h2>
                <div className="space-y-3">
                  {upcoming.map((b) => <BookingRow key={b.id} booking={b} />)}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Past stays</h2>
                <div className="space-y-3">
                  {past.map((b) => <BookingRow key={b.id} booking={b} />)}
                </div>
              </section>
            )}

            {cancelled.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold mb-3">Cancelled</h2>
                <div className="space-y-3">
                  {cancelled.map((b) => <BookingRow key={b.id} booking={b} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

function BookingRow({ booking }: { booking: any }) {
  const rooms = booking.items.map((i: any) => i.roomType.name).join(", ")
  return (
    <div className="bg-white border border-border rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/account/bookings/${booking.id}`}
              className="font-semibold text-deepOceanBlue hover:text-stayoraTeal"
            >
              {booking.hotel.name}
            </Link>
            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[booking.status] ?? "bg-warmWhite border-border"}`}>
              {booking.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-secondaryText flex items-center gap-1 mt-1">
            <MapPin className="h-3.5 w-3.5" />
            {booking.hotel.city.name}
          </p>
          <p className="text-sm mt-2">
            {formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)} ·{" "}
            {booking.numberOfNights} night{booking.numberOfNights === 1 ? "" : "s"} · {rooms}
          </p>
          <p className="text-xs text-secondaryText mt-1">Ref {booking.bookingReference}</p>
        </div>

        <div className="text-right">
          <p className="font-semibold">{formatCurrency(booking.totalAmount)}</p>
          <p className="text-xs text-secondaryText mb-2">
            {booking.amountPaid >= booking.totalAmount ? "Paid" : `${formatCurrency(booking.outstandingAmount)} due`}
          </p>
          <div className="flex gap-2 justify-end">
            {booking.outstandingAmount > 0 && booking.status !== "CANCELLED" && (
              <Link href={`/bookings/${booking.id}/payment`}>
                <Button size="sm" className="bg-coral hover:bg-coral/90">Pay now</Button>
              </Link>
            )}
            <Link href={`/account/bookings/${booking.id}`}>
              <Button size="sm" variant="outline">Details</Button>
            </Link>
            <Link href={`/api/invoices/${booking.id}`} target="_blank">
              <Button size="sm" className="bg-stayoraTeal hover:bg-stayoraTeal/90">
                <Download className="h-3.5 w-3.5 mr-1" />
                Invoice
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
