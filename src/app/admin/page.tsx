import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Users, Building2, CalendarCheck, IndianRupee, Clock, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminOverview() {
  await pageAdmin()

  const [
    users, hotels, approvedHotels, pendingHotels, bookings, confirmed,
    cancelled, payments, refunds, pendingApprovals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.hotel.count(),
    prisma.hotel.count({ where: { status: "APPROVED" } }),
    prisma.hotel.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } } }),
    prisma.booking.count({ where: { status: "CANCELLED" } }),
    prisma.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amount: true } }),
    prisma.refund.aggregate({ where: { status: "REFUNDED" }, _sum: { amount: true } }),
    prisma.hotel.findMany({
      where: { status: "PENDING_APPROVAL" },
      include: { city: true, owner: { select: { name: true } } },
      take: 5,
      orderBy: { createdAt: "asc" },
    }),
  ])

  const gbv = await prisma.booking.aggregate({
    where: { status: { in: ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT"] } },
    _sum: { totalAmount: true },
  })

  const recent = await prisma.booking.findMany({
    include: { hotel: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  const topDestinations = await prisma.hotel.groupBy({
    by: ["cityId"],
    where: { status: "APPROVED" },
    _count: true,
    orderBy: { _count: { cityId: "desc" } },
    take: 5,
  })
  const cityNames = await prisma.city.findMany({
    where: { id: { in: topDestinations.map((d) => d.cityId) } },
    select: { id: true, name: true },
  })
  const cityMap = new Map(cityNames.map((c) => [c.id, c.name]))

  const stats = [
    { label: "Registered users", value: users, icon: Users },
    { label: "Properties", value: `${approvedHotels} / ${hotels}`, icon: Building2, sub: `${pendingHotels} pending` },
    { label: "Reservations", value: bookings, icon: CalendarCheck, sub: `${cancelled} cancelled` },
    { label: "Gross booking value", value: formatCurrency(gbv._sum.totalAmount ?? 0), icon: IndianRupee, sub: `${formatCurrency(payments._sum.amount ?? 0)} collected` },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <s.icon className="h-5 w-5 text-stayoraTeal mb-2" />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-xs text-secondaryText">{s.label}</p>
              {s.sub && <p className="text-[11px] text-secondaryText mt-0.5">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Confirmed reservations</p>
            <p className="text-lg font-semibold">{confirmed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Refunded</p>
            <p className="text-lg font-semibold">{formatCurrency(refunds._sum.amount ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Platform commission (12%)</p>
            <p className="text-lg font-semibold">
              {formatCurrency(Math.round((payments._sum.amount ?? 0) * 0.12))}
            </p>
          </CardContent>
        </Card>
      </div>

      {pendingApprovals.length > 0 && (
        <Card className="border-warningAmber/40">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4 text-warningAmber" />
              Awaiting approval
            </CardTitle>
            <Link href="/admin/hotels" className="text-sm text-stayoraTeal hover:underline flex items-center gap-1">
              Review <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {pendingApprovals.map((h) => (
                <li key={h.id} className="py-2 flex justify-between text-sm">
                  <span>{h.name} <span className="text-secondaryText">· {h.city.name}</span></span>
                  <span className="text-secondaryText">{h.owner.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg">Recent bookings</CardTitle></CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-secondaryText">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((b) => (
                  <li key={b.id} className="py-2 text-sm flex justify-between">
                    <div>
                      <p>{b.guestName}</p>
                      <p className="text-xs text-secondaryText">{b.hotel.name} · {formatDate(b.checkInDate)}</p>
                    </div>
                    <span className="text-xs text-secondaryText">{formatCurrency(b.totalAmount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Top destinations</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {topDestinations.map((d) => (
                <li key={d.cityId} className="py-2 text-sm flex justify-between">
                  <span>{cityMap.get(d.cityId) ?? "—"}</span>
                  <span className="text-secondaryText">{d._count} hotels</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
