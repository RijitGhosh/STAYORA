import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await pageAdmin()
  const sp = await searchParams
  const status = typeof sp.status === "string" ? sp.status : ""

  const bookings = await prisma.booking.findMany({
    where: status ? { status } : {},
    include: { hotel: { select: { name: true } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const tabs = ["", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Reservations</h2>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t || "all"}
            href={`/admin/bookings${t ? `?status=${t}` : ""}`}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              status === t ? "bg-stayoraTeal text-white border-stayoraTeal" : "bg-white border-border hover:bg-warmWhite"
            }`}
          >
            {t ? t.replace(/_/g, " ") : "All"}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-deepOceanBlue text-white">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Reference</th>
                <th className="text-left px-4 py-2.5 font-medium">Guest</th>
                <th className="text-left px-4 py-2.5 font-medium">Hotel</th>
                <th className="text-left px-4 py-2.5 font-medium">Stay</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                <th className="text-right px-4 py-2.5 font-medium">Paid</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-mono text-xs">{b.bookingReference}</td>
                  <td className="px-4 py-2.5">
                    {b.guestName}
                    <div className="text-[11px] text-secondaryText">{b.user?.email ?? b.guestEmail}</div>
                  </td>
                  <td className="px-4 py-2.5 text-secondaryText">{b.hotel.name}</td>
                  <td className="px-4 py-2.5 text-secondaryText text-xs">
                    {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-warmWhite border border-border">
                      {b.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">{formatCurrency(b.totalAmount)}</td>
                  <td className="px-4 py-2.5 text-right text-secondaryText">{formatCurrency(b.amountPaid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
