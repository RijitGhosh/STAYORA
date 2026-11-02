import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-successGreen/10 text-successGreen border-successGreen/30",
  CHECKED_IN: "bg-stayoraTeal/10 text-stayoraTeal border-stayoraTeal/30",
  CHECKED_OUT: "bg-secondaryText/10 text-secondaryText border-border",
  CANCELLED: "bg-errorRed/10 text-errorRed border-errorRed/30",
  PENDING_PAYMENT: "bg-warningAmber/10 text-warningAmber border-warningAmber/30",
  NO_SHOW: "bg-warningAmber/10 text-warningAmber border-warningAmber/30",
}

export default async function OwnerBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = await searchParams
  const user = await pageStaff("/owner/bookings")
  const hotels = await accessibleHotels(user)

  const status = typeof sp.status === "string" ? sp.status : ""
  const hotelFilter = typeof sp.hotelId === "string" ? sp.hotelId : ""

  const bookings = await prisma.booking.findMany({
    where: {
      hotelId: { in: hotels.map((h) => h.id) },
      ...(status ? { status } : {}),
      ...(hotelFilter ? { hotelId: hotelFilter } : {}),
    },
    include: {
      hotel: { select: { name: true } },
      items: { include: { roomType: { select: { name: true } }, room: { select: { roomNumber: true } } } },
    },
    orderBy: { checkInDate: "desc" },
    take: 100,
  })

  const filters = [
    { value: "", label: "All" },
    { value: "CONFIRMED", label: "Confirmed" },
    { value: "CHECKED_IN", label: "In house" },
    { value: "CHECKED_OUT", label: "Departed" },
    { value: "CANCELLED", label: "Cancelled" },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Reservations</h2>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => {
            const qs = new URLSearchParams()
            if (f.value) qs.set("status", f.value)
            if (hotelFilter) qs.set("hotelId", hotelFilter)
            return (
              <Link
                key={f.value}
                href={`/owner/bookings${qs.toString() ? `?${qs}` : ""}`}
                className={`text-xs px-3 py-1.5 rounded-full border ${
                  status === f.value
                    ? "bg-stayoraTeal text-white border-stayoraTeal"
                    : "bg-white border-border hover:bg-warmWhite"
                }`}
              >
                {f.label}
              </Link>
            )
          })}
        </div>
      </div>

      {bookings.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-secondaryText">
          No reservations match this filter.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {bookings.map((b) => (
            <Card key={b.id}>
              <CardContent className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{b.guestName}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status] ?? ""}`}>
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-xs text-secondaryText mt-0.5">
                      {b.bookingReference} · {b.hotel.name}
                    </p>
                    <p className="text-sm mt-1">
                      {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)} ·{" "}
                      {b.numberOfNights} night{b.numberOfNights === 1 ? "" : "s"} ·{" "}
                      {b.items.map((i) => `${i.roomType.name}${i.room?.roomNumber ? ` (${i.room.roomNumber})` : ""}`).join(", ")}
                    </p>
                    <p className="text-xs text-secondaryText mt-0.5">
                      {b.guestEmail} · {b.guestPhone}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(b.totalAmount)}</p>
                    <p className="text-xs text-secondaryText">
                      {b.amountPaid >= b.totalAmount ? "Paid" : `${formatCurrency(b.outstandingAmount)} due`}
                    </p>
                    <div className="flex gap-2 mt-2 justify-end">
                      <Link href={`/operations/bookings/${b.id}`} className="text-xs text-stayoraTeal hover:underline">
                        Open
                      </Link>
                      <Link href={`/api/invoices/${b.id}`} target="_blank" className="text-xs text-stayoraTeal hover:underline">
                        Invoice
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
