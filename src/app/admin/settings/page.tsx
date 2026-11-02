import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminSettingsPage() {
  await pageAdmin()

  const [hotels, coupons, users] = await Promise.all([
    prisma.hotel.aggregate({ _avg: { commissionRate: true }, _count: true }),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.user.groupBy({ by: ["role"], _count: true }),
  ])

  const integrations = [
    { name: "Razorpay payments", status: "Not configured", detail: "Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env to enable card and UPI checkout.", ok: false },
    { name: "Email delivery", status: "Not configured", detail: "Add SMTP settings to .env. Password reset links are currently printed to the server console.", ok: false },
    { name: "Maps", status: "Not configured", detail: "Map and directions are not displayed without a map provider key.", ok: false },
    { name: "Image storage", status: "Seed images only", detail: "Photos are stock imagery referenced by URL. Uploads are not implemented.", ok: false },
    { name: "Database", status: "SQLite (local file)", detail: "prisma/dev.db — suitable for development, not for production scale.", ok: true },
    { name: "Sessions", status: "JWT (NextAuth)", detail: "Credentials sign-in with bcrypt hashing.", ok: true },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Properties</p>
            <p className="text-lg font-semibold">{hotels._count}</p>
            <p className="text-xs text-secondaryText">
              Avg commission {Math.round((hotels._avg.commissionRate ?? 0) * 10) / 10}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Active coupons</p>
            <p className="text-lg font-semibold">{coupons}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-secondaryText">Accounts by role</p>
            <div className="text-xs text-secondaryText mt-1 space-y-0.5">
              {users.map((u) => (
                <p key={u.role}>{u.role.replace(/_/g, " ").toLowerCase()}: {u._count}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Integrations</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {integrations.map((i) => (
              <li key={i.name} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-sm">{i.name}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    i.ok ? "bg-successGreen/10 text-successGreen" : "bg-warningAmber/10 text-warningAmber"
                  }`}>{i.status}</span>
                </div>
                <p className="text-xs text-secondaryText mt-1">{i.detail}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
