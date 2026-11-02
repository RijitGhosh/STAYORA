import { Card, CardContent } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import StaffManager from "@/components/dashboard/StaffManager"

export const dynamic = "force-dynamic"

export default async function StaffPage() {
  const user = await pageStaff("/owner/staff")
  const hotels = await accessibleHotels(user)
  const hotelIds = hotels.map((h) => h.id)

  const memberships = await prisma.hotelStaffMembership.findMany({
    where: { hotelId: { in: hotelIds } },
    include: { user: { select: { name: true, email: true, role: true } }, hotel: { select: { name: true } } },
  })

  const candidates = await prisma.user.findMany({
    where: { role: { in: ["RECEPTIONIST", "HOUSEKEEPING", "FINANCE", "HOTEL_OWNER", "SUPPORT"] } },
    select: { id: true, name: true, email: true, role: true },
    take: 50,
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Staff access</h2>
        <p className="text-sm text-secondaryText">
          Grant a user access to a property. Staff only see reservations and guests for properties
          they are assigned to.
        </p>
      </div>

      <StaffManager
        hotels={hotels.map((h) => ({ id: h.id, name: h.name }))}
        candidates={candidates}
        memberships={memberships.map((m) => ({
          id: m.id,
          hotelName: m.hotel.name,
          userName: m.user.name,
          email: m.user.email,
          role: m.role,
        }))}
      />
    </div>
  )
}
