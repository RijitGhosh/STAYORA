import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { pageStaff, accessibleHotels } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { Plus, MapPin, Star } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_STYLE: Record<string, string> = {
  APPROVED: "bg-successGreen/10 text-successGreen border-successGreen/30",
  PENDING_APPROVAL: "bg-warningAmber/10 text-warningAmber border-warningAmber/30",
  SUSPENDED: "bg-errorRed/10 text-errorRed border-errorRed/30",
  REJECTED: "bg-errorRed/10 text-errorRed border-errorRed/30",
  INACTIVE: "bg-secondaryText/10 text-secondaryText border-border",
}

export default async function PropertiesPage() {
  const user = await pageStaff("/owner/properties")
  const hotels = await accessibleHotels(user)
  const ids = hotels.map((h) => h.id)

  const details = await prisma.hotel.findMany({
    where: { id: { in: ids } },
    include: {
      city: { include: { state: true } },
      images: { take: 1, orderBy: { order: "asc" } },
      roomTypes: true,
      _count: { select: { roomTypes: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your properties</h2>
        <Link href="/owner/properties/new">
          <Button className="bg-stayoraTeal hover:bg-stayoraTeal/90">
            <Plus className="h-4 w-4 mr-2" /> Add property
          </Button>
        </Link>
      </div>

      {details.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-sm text-secondaryText">
            No properties yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {details.map((h) => (
            <Card key={h.id}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-44 h-32 sm:h-auto bg-warmWhite shrink-0 overflow-hidden rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none">
                    {h.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={h.images[0].url} alt={h.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-wrap justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{h.name}</p>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${STATUS_STYLE[h.status] ?? ""}`}>
                          {h.status.replace(/_/g, " ")}
                        </span>
                        {h.starRating ? (
                          <span className="flex">
                            {Array.from({ length: h.starRating }).map((_, i) => (
                              <Star key={i} className="h-3 w-3 fill-goldenYellow text-goldenYellow" />
                            ))}
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-secondaryText flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {h.city.name}, {h.city.state.name}
                      </p>
                      <p className="text-xs text-secondaryText mt-2">
                        {h.roomTypes.length} room types · {h._count.roomTypes} room type(s) ·{" "}
                        from {formatCurrency(h.roomTypes.length ? Math.min(...h.roomTypes.map((r) => r.baseRate)) : 0)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Link href={`/owner/properties/${h.id}`}>
                        <Button size="sm" variant="outline" className="w-full">Manage</Button>
                      </Link>
                      <Link href={`/hotels/${h.slug}`} target="_blank">
                        <Button size="sm" variant="ghost" className="w-full">View public page</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
