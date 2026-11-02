import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminPaymentsPage() {
  await pageAdmin()

  const [payments, refunds, captured, refunded] = await Promise.all([
    prisma.payment.findMany({
      include: { booking: { select: { bookingReference: true, guestName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.refund.findMany({
      include: { payment: { include: { booking: { select: { bookingReference: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.payment.aggregate({ where: { status: "CAPTURED" }, _sum: { amount: true }, _count: true }),
    prisma.refund.aggregate({ where: { status: "REFUNDED" }, _sum: { amount: true } }),
  ])

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Payments</h2>
        <p className="text-sm text-secondaryText">
          Payment gateway is not connected in this build, so no payments are recorded and no money
          has been collected. These tables show the real payment and refund records, which are empty
          until Razorpay keys are configured.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Captured payments</p>
            <p className="text-lg font-semibold">{captured._count}</p>
            <p className="text-xs text-secondaryText">{formatCurrency(captured._sum.amount ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Refunds paid</p>
            <p className="text-lg font-semibold">{formatCurrency(refunded._sum.amount ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Net collected</p>
            <p className="text-lg font-semibold">
              {formatCurrency((captured._sum.amount ?? 0) - (refunded._sum.amount ?? 0))}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment records</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {payments.length === 0 ? (
            <p className="p-6 text-sm text-secondaryText">No payment records.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-deepOceanBlue text-white">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Booking</th>
                  <th className="text-left px-4 py-2.5 font-medium">Guest</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Amount</th>
                  <th className="text-left px-4 py-2.5 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs">{p.booking.bookingReference}</td>
                    <td className="px-4 py-2.5">{p.booking.guestName}</td>
                    <td className="px-4 py-2.5 text-xs">{p.status}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-2.5 text-secondaryText text-xs">{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Refunds</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {refunds.length === 0 ? (
            <p className="p-6 text-sm text-secondaryText">No refund records.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-deepOceanBlue text-white">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">Booking</th>
                  <th className="text-left px-4 py-2.5 font-medium">Reason</th>
                  <th className="text-left px-4 py-2.5 font-medium">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2.5 font-mono text-xs">{r.payment.booking.bookingReference}</td>
                    <td className="px-4 py-2.5">{r.reason}</td>
                    <td className="px-4 py-2.5 text-xs">{r.status}</td>
                    <td className="px-4 py-2.5 text-right">{formatCurrency(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
