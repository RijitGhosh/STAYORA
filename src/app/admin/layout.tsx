import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Sidebar, { NavItem } from "@/components/dashboard/Sidebar"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await pageAdmin()

  const [pendingHotels, openTickets] = await Promise.all([
    prisma.hotel.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
  ])

  const items: NavItem[] = [
    { href: "/admin", label: "Overview", icon: "dashboard" },
    { href: "/admin/hotels", label: "Hotels", icon: "building", badge: pendingHotels || undefined },
    { href: "/admin/users", label: "Users", icon: "users" },
    { href: "/admin/bookings", label: "Bookings", icon: "calendarCheck" },
    { href: "/admin/payments", label: "Payments", icon: "card" },
    { href: "/admin/coupons", label: "Coupons", icon: "ticket" },
    { href: "/admin/support", label: "Support", icon: "message", badge: openTickets || undefined },
    { href: "/admin/audit-logs", label: "Audit log", icon: "scroll" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
  ]

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Platform administration</h1>
          <p className="text-sm text-secondaryText">Approve properties, manage users, monitor activity</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <Sidebar title="Administer" items={items} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
