import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Sidebar, { NavItem } from "@/components/dashboard/Sidebar"
import { pageStaff } from "@/lib/permissions"
import { accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await pageStaff("/owner")
  const hotels = await accessibleHotels(user)

  const pendingCount = await prisma.booking.count({
    where: {
      hotelId: { in: hotels.map((h) => h.id) },
      status: "CONFIRMED",
    },
  })

  const items: NavItem[] = [
    { href: "/owner", label: "Overview", icon: "dashboard" },
    { href: "/owner/properties", label: "Properties", icon: "building" },
    { href: "/owner/rates", label: "Rates & rooms", icon: "rupee" },
    { href: "/owner/inventory", label: "Inventory", icon: "calendarRange" },
    { href: "/owner/bookings", label: "Bookings", icon: "calendarCheck", badge: pendingCount || undefined },
    { href: "/owner/reports", label: "Reports", icon: "chart" },
    { href: "/owner/staff", label: "Staff", icon: "users" },
  ]

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Property management</h1>
          <p className="text-sm text-secondaryText">
            {user.name} · {user.role.replace(/_/g, " ").toLowerCase()} ·{" "}
            {hotels.length} propert{hotels.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <Sidebar title="Manage" items={items} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
