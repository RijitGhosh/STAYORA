import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import HotelApprovalList from "@/components/admin/HotelApprovalList"

export const dynamic = "force-dynamic"

export default async function AdminHotelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await pageAdmin()
  const sp = await searchParams
  const status = typeof sp.status === "string" ? sp.status : "PENDING_APPROVAL"

  const hotels = await prisma.hotel.findMany({
    where: status ? { status } : {},
    include: {
      city: { include: { state: true } },
      owner: { select: { id: true, name: true, email: true } },
      roomTypes: { select: { id: true } },
      _count: { select: { bookings: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const counts = await prisma.hotel.groupBy({ by: ["status"], _count: true })
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count]))

  const tabs = [
    { key: "PENDING_APPROVAL", label: `Pending (${byStatus.PENDING_APPROVAL ?? 0})` },
    { key: "APPROVED", label: `Approved (${byStatus.APPROVED ?? 0})` },
    { key: "SUSPENDED", label: `Suspended (${byStatus.SUSPENDED ?? 0})` },
    { key: "REJECTED", label: `Rejected (${byStatus.REJECTED ?? 0})` },
    { key: "", label: "All" },
  ]

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Properties</h2>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/hotels${t.key ? `?status=${t.key}` : ""}`}
            className={`text-xs px-3 py-1.5 rounded-full border ${
              status === t.key ? "bg-stayoraTeal text-white border-stayoraTeal" : "bg-white border-border hover:bg-warmWhite"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {hotels.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-secondaryText">
          No properties in this state.
        </CardContent></Card>
      ) : (
        <HotelApprovalList
          hotels={hotels.map((h) => ({
            id: h.id,
            name: h.name,
            slug: h.slug,
            status: h.status,
            city: `${h.city.name}, ${h.city.state.name}`,
            ownerName: h.owner.name,
            ownerEmail: h.owner.email,
            roomTypes: h.roomTypes.length,
            bookings: h._count.bookings,
            starRating: h.starRating,
            createdAt: h.createdAt.toISOString(),
          }))}
        />
      )}
    </div>
  )
}
