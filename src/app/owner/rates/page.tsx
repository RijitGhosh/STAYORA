import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import RateEditor from "@/components/dashboard/RateEditor"
import { formatCurrency } from "@/lib/utils"
import { WEEKEND_PREMIUM } from "@/lib/pricing"

export const dynamic = "force-dynamic"

export default async function RatesPage() {
  const user = await pageStaff("/owner/rates")
  const hotels = await accessibleHotels(user)

  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId: { in: hotels.map((h) => h.id) } },
    include: { hotel: { select: { id: true, name: true } } },
    orderBy: [{ hotelId: "asc" }, { baseRate: "asc" }],
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Rates</h2>
        <p className="text-sm text-secondaryText">
          Base rate per night for each room type. Weekends (Fri &amp; Sat) are automatically
          charged {(WEEKEND_PREMIUM * 100).toFixed(0)}% more. GST is added at checkout —
          12% up to ₹7,500 a night, 18% above.
        </p>
      </div>

      {roomTypes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-secondaryText">
          Add a room type first, then set its rate here.
        </CardContent></Card>
      ) : (
        <RateEditor
          rows={roomTypes.map((rt) => ({
            id: rt.id,
            hotelName: rt.hotel.name,
            name: rt.name,
            baseRate: rt.baseRate,
            maxOccupancy: rt.maxOccupancy,
            isActive: rt.isActive,
          }))}
        />
      )}
    </div>
  )
}
