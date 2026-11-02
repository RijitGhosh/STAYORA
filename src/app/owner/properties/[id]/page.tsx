import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { pageStaff, requireHotelAccess, AuthzError } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import PropertyForm from "@/components/dashboard/PropertyForm"
import RoomTypeManager from "@/components/dashboard/RoomTypeManager"

export const dynamic = "force-dynamic"

export default async function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await pageStaff(`/owner/properties/${id}`)

  try {
    await requireHotelAccess(user, id)
  } catch {
    redirect("/access-denied")
  }

  const [hotel, cities] = await Promise.all([
    prisma.hotel.findUnique({
      where: { id },
      include: {
        city: { include: { state: true } },
        images: { orderBy: { order: "asc" } },
        roomTypes: {
          include: { rooms: { orderBy: { roomNumber: "asc" } } },
          orderBy: { baseRate: "asc" },
        },
        amenities: { include: { amenity: true } },
        staff: { include: { user: true } },
      },
    }),
    prisma.city.findMany({ include: { state: true }, orderBy: { name: "asc" } }),
  ])

  if (!hotel) notFound()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/owner/properties" className="text-sm text-stayoraTeal hover:underline">← All properties</Link>
          <h2 className="text-lg font-semibold mt-1">{hotel.name}</h2>
          <p className="text-sm text-secondaryText">
            {hotel.city.name}, {hotel.city.state.name} · {hotel.status.replace(/_/g, " ")}
          </p>
        </div>
        <Link href={`/hotels/${hotel.slug}`} target="_blank">
          <Button variant="outline" size="sm">View public page</Button>
        </Link>
      </div>

      {hotel.status !== "APPROVED" && (
        <div className="bg-warningAmber/10 border border-warningAmber/30 rounded-lg p-4 text-sm">
          <p className="font-medium text-warningAmber">
            {hotel.status === "PENDING_APPROVAL"
              ? "Awaiting approval"
              : hotel.status === "SUSPENDED"
              ? "Suspended by an administrator"
              : "Not approved"}
          </p>
          <p className="text-secondaryText mt-1">
            {hotel.status === "PENDING_APPROVAL"
              ? "You can prepare rooms and rates now. The property becomes bookable once an administrator approves it."
              : "This property is not visible to guests."}
          </p>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Room types</CardTitle></CardHeader>
        <CardContent>
          <RoomTypeManager hotelId={hotel.id} roomTypes={hotel.roomTypes.map((rt) => ({
            id: rt.id,
            name: rt.name,
            baseRate: rt.baseRate,
            maxOccupancy: rt.maxOccupancy,
            bedConfiguration: rt.bedConfiguration,
            isActive: rt.isActive,
            rooms: rt.rooms.map((r) => ({ id: r.id, roomNumber: r.roomNumber, status: r.status })),
          }))} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Property details</CardTitle></CardHeader>
        <CardContent>
          <PropertyForm
            mode="edit"
            cities={cities.map((c) => ({ id: c.id, label: `${c.name}, ${c.state.name}` }))}
            initial={{
              id: hotel.id,
              name: hotel.name,
              description: hotel.description,
              address: hotel.address,
              cityId: hotel.cityId,
              pincode: hotel.pincode,
              phone: hotel.phone,
              email: hotel.email,
              starRating: hotel.starRating,
              hotelType: hotel.hotelType,
              checkInTime: hotel.checkInTime,
              checkOutTime: hotel.checkOutTime,
              gstin: hotel.gstin,
              commissionRate: hotel.commissionRate,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Amenities</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {hotel.amenities.map((a) => (
              <span key={a.amenityId} className="text-xs px-2 py-1 rounded-full bg-warmWhite border border-border">
                {a.amenity.name}
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Staff with access</CardTitle></CardHeader>
        <CardContent>
          {hotel.staff.length === 0 ? (
            <p className="text-sm text-secondaryText">Only you have access to this property.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {hotel.staff.map((s) => (
                <li key={s.id} className="flex justify-between border-b border-border pb-2 last:border-0">
                  <span>{s.user.name} <span className="text-secondaryText">({s.user.email})</span></span>
                  <span className="text-secondaryText">{s.role}</span>
                </li>
              ))}
            </ul>
          )}
          <Link href="/owner/staff" className="inline-block mt-3 text-sm text-stayoraTeal hover:underline">
            Manage staff →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
