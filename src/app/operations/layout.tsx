import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Sidebar, { NavItem } from "@/components/dashboard/Sidebar"
import { pageStaff } from "@/lib/permissions"

export const dynamic = "force-dynamic"

export default async function OperationsLayout({ children }: { children: React.ReactNode }) {
  await pageStaff("/operations")

  const items: NavItem[] = [
    { href: "/operations", label: "Front desk", icon: "dashboard" },
    { href: "/operations/arrivals", label: "Arrivals", icon: "calendarCheck" },
    { href: "/operations/departures", label: "Departures", icon: "calendarX" },
    { href: "/operations/rooms", label: "Rooms", icon: "bed" },
    { href: "/operations/housekeeping", label: "Housekeeping", icon: "sparkles" },
  ]

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">Hotel operations</h1>
          <p className="text-sm text-secondaryText">Front desk, arrivals, departures and housekeeping</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
          <Sidebar title="Operate" items={items} />
          <main className="min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
