import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pageStaff, requireOperations } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import CheckInPanel from "@/components/operations/CheckInPanel"
import CheckOutPanel from "@/components/operations/CheckOutPanel"
import ExtraCharges, { type Charge } from "@/components/operations/ExtraCharges"

export const dynamic = "force-dynamic"

export default async function OperationsBookingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await pageStaff(`/operations/bookings/${id}`)

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      hotel: true,
      items: { include: { roomType: true, room: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      additionalChargesList: { orderBy: { createdAt: "asc" } },
      checkInRecord: true,
      checkOutRecord: true,
      payments: true,
    },
  })

  if (!booking) notFound()

  try {
    await requireOperations(user, booking.hotelId)
  } catch {
    redirect("/access-denied")
  }

  const item = booking.items[0]
  const isCheckedIn = booking.status === "CHECKED_IN"
  const isCheckedOut = booking.status === "CHECKED_OUT"
  const canCheckIn = booking.status === "CONFIRMED"
  const canCheckOut = booking.status === "CHECKED_IN"

  // Physical rooms of this type that are free for the stay.
  const allRooms = item
    ? await prisma.room.findMany({
        where: { roomTypeId: item.roomTypeId, isActive: true, status: { not: "MAINTENANCE" } },
        orderBy: { roomNumber: "asc" },
      })
    : []

  const occupied = item
    ? await prisma.bookingItem.findMany({
        where: {
          roomTypeId: item.roomTypeId,
          roomId: { not: null },
          bookingId: { not: booking.id },
          booking: {
            status: { in: ["CONFIRMED", "CHECKED_IN"] },
            checkInDate: { lt: booking.checkOutDate },
            checkOutDate: { gt: booking.checkInDate },
          },
        },
        select: { roomId: true },
      })
    : []

  const occupiedIds = new Set(occupied.map((o) => o.roomId))
  const availableRooms = allRooms.filter((r) => !occupiedIds.has(r.id))

  const charges: Charge[] = booking.additionalChargesList.map((c) => ({
    id: c.id,
    description: c.description,
    amount: c.amount,
    createdAt: c.createdAt.toISOString(),
  }))
  const extrasTotal = charges.reduce((s, c) => s + c.amount, 0)
  const finalTotal = booking.totalAmount + extrasTotal

  return (
    <div className="space-y-5">
      <div>
        <Link href="/operations/arrivals" className="text-sm text-stayoraTeal hover:underline">← Arrivals</Link>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-1">
          <div>
            <h2 className="text-lg font-semibold">{booking.guestName}</h2>
            <p className="text-sm text-secondaryText">
              {booking.hotel.name} · {booking.bookingReference}
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full border border-border bg-white">
            {booking.status.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-secondaryText">Stay</p>
            <p className="font-medium text-sm">{formatDate(booking.checkInDate)} → {formatDate(booking.checkOutDate)}</p>
            <p className="text-xs text-secondaryText mt-0.5">{booking.numberOfNights} night{booking.numberOfNights === 1 ? "" : "s"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-secondaryText">Room</p>
            <p className="font-medium text-sm">
              {item ? `${item.roomType.name} × ${item.quantity}` : "—"}
            </p>
            <p className="text-xs text-secondaryText mt-0.5">
              {item?.room ? `Room ${item.room.roomNumber}` : "Not assigned"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-secondaryText">Balance</p>
            <p className="font-medium text-sm">{formatCurrency(booking.outstandingAmount)} due</p>
            <p className="text-xs text-secondaryText mt-0.5">
              Total {formatCurrency(booking.totalAmount)} · paid {formatCurrency(booking.amountPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {canCheckIn && (
        <CheckInPanel
          bookingId={booking.id}
          rooms={availableRooms.map((r) => ({ id: r.id, roomNumber: r.roomNumber }))}
          outstanding={booking.outstandingAmount}
        />
      )}

      {(isCheckedIn || isCheckedOut) && (
        <>
          <ExtraCharges bookingId={booking.id} charges={charges} locked={isCheckedOut} />

          <Card>
            <CardHeader><CardTitle className="text-base">Bill</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Room charges" value={formatCurrency(booking.roomCharges + booking.discounts)} />
              {booking.discounts > 0 && <Row label="Discount" value={`−${formatCurrency(booking.discounts)}`} />}
              <Row label="GST" value={formatCurrency(booking.taxes)} />
              <Row label="Extra charges" value={formatCurrency(extrasTotal)} />
              <div className="flex justify-between font-semibold border-t border-border pt-2 text-base">
                <span>Final bill</span>
                <span>{formatCurrency(finalTotal)}</span>
              </div>
              <Row label="Paid" value={formatCurrency(booking.amountPaid)} />
              <Row label="Balance due" value={formatCurrency(finalTotal - booking.amountPaid)} />
            </CardContent>
          </Card>
        </>
      )}

      {canCheckOut && (
        <CheckOutPanel bookingId={booking.id} balanceDue={finalTotal - booking.amountPaid} />
      )}

      {isCheckedOut && booking.checkOutRecord && (
        <div className="bg-successGreen/10 border border-successGreen/30 rounded-lg p-4 text-sm">
          <p className="font-medium text-successGreen">Checked out</p>
          <p className="text-secondaryText mt-1">
            {new Date(booking.checkOutRecord.checkOutTime).toLocaleString("en-IN")} · final bill{" "}
            {formatCurrency(booking.checkOutRecord.finalBillAmount)}
          </p>
          <Link href={`/api/invoices/${booking.id}`} target="_blank" className="text-stayoraTeal hover:underline text-xs">
            Download final invoice →
          </Link>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">History</CardTitle></CardHeader>
        <CardContent>
          <ol className="space-y-2">
            {booking.statusHistory.map((h) => (
              <li key={h.id} className="flex gap-2 text-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-stayoraTeal mt-2 shrink-0" />
                <div>
                  <p className="font-medium">{h.status.replace(/_/g, " ")}</p>
                  <p className="text-xs text-secondaryText">
                    {new Date(h.createdAt).toLocaleString("en-IN")}
                    {h.notes ? ` · ${h.notes}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-secondaryText">{label}</span>
      <span>{value}</span>
    </div>
  )
}
