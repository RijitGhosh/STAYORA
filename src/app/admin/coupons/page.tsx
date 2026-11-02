import { Card, CardContent } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import CouponManager from "@/components/admin/CouponManager"

export const dynamic = "force-dynamic"

export default async function AdminCouponsPage() {
  await pageAdmin()
  const coupons = await prisma.coupon.findMany({
    include: { _count: { select: { redemptions: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Coupons</h2>
        <p className="text-sm text-secondaryText">
          Discounts are validated on the server at checkout, including per-user and overall
          redemption limits.
        </p>
      </div>

      <CouponManager
        initial={coupons.map((c) => ({
          id: c.id,
          code: c.code,
          type: c.type,
          value: c.value,
          minBookingAmount: c.minBookingAmount,
          maxDiscount: c.maxDiscount,
          usedCount: c.usedCount,
          usageLimit: c.usageLimit,
          perUserLimit: c.perUserLimit,
          validTo: c.validTo.toISOString(),
          isActive: c.isActive,
          redemptions: c._count.redemptions,
        }))}
      />
    </div>
  )
}
