import Link from "next/link"
import { Star, MapPin, Wifi, Car, Coffee, Waves, Dumbbell, Wind, Utensils } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import type { SearchResultHotel } from "@/lib/hotel-queries"

const ICONS: Record<string, any> = {
  "Free WiFi": Wifi, "Free Parking": Car, "Breakfast Included": Coffee,
  "Swimming Pool": Waves, "Fitness Centre": Dumbbell, "Air Conditioning": Wind,
  Restaurant: Utensils,
}

export default function HotelCard({
  hotel, checkIn, checkOut, rooms, adults, children,
}: {
  hotel: SearchResultHotel
  checkIn?: string
  checkOut?: string
  rooms: number
  adults: number
  children: number
}) {
  const qs = new URLSearchParams()
  if (checkIn) qs.set("checkIn", checkIn)
  if (checkOut) qs.set("checkOut", checkOut)
  qs.set("rooms", String(rooms))
  qs.set("adults", String(adults))
  qs.set("children", String(children))
  const href = `/hotels/${hotel.slug}?${qs.toString()}`

  const shown = hotel.amenities.slice(0, 5)

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-3">
        <div className="h-52 md:h-full bg-warmWhite">
          {hotel.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
          ) : null}
        </div>

        <div className="md:col-span-2 p-5 flex flex-col">
          <div className="flex justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] uppercase tracking-wide font-medium text-secondaryText">
                  {hotel.hotelType.toLowerCase()}
                </span>
                {hotel.stars ? (
                  <span className="flex items-center">
                    {Array.from({ length: hotel.stars }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-goldenYellow text-goldenYellow" />
                    ))}
                  </span>
                ) : null}
              </div>
              <Link href={href} className="text-lg font-semibold text-deepOceanBlue hover:text-stayoraTeal">
                {hotel.name}
              </Link>
              <p className="text-sm text-secondaryText flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5" />
                {hotel.city}, {hotel.state}
              </p>
            </div>

            {hotel.reviewCount > 0 && (
              <div className="text-right shrink-0">
                <div className="inline-flex items-center gap-1 bg-successGreen text-white text-sm font-semibold px-2 py-1 rounded">
                  {hotel.avgRating.toFixed(1)}
                </div>
                <p className="text-xs text-secondaryText mt-1">{hotel.reviewCount} reviews</p>
              </div>
            )}
          </div>

          <p className="text-sm text-secondaryText mt-3 line-clamp-2">{hotel.description}</p>

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-secondaryText">
            {shown.map((a) => {
              const Icon = ICONS[a]
              return (
                <span key={a} className="inline-flex items-center gap-1">
                  {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                  {a}
                </span>
              )
            })}
          </div>

          <div className="flex flex-wrap items-end justify-between gap-3 mt-auto pt-4">
            <div>
              <p className="text-2xl font-bold text-deepOceanBlue">
                {formatCurrency(hotel.fromPrice)}
                <span className="text-sm font-normal text-secondaryText"> / night</span>
              </p>
              <p className="text-xs text-secondaryText">
                {formatCurrency(hotel.estimatedTotal)} total for {hotel.nights} night{hotel.nights > 1 ? "s" : ""}, incl. taxes
              </p>
              <p className="text-xs text-successGreen mt-1">Free cancellation up to 48h before check-in</p>
            </div>
            <Link href={href}>
              <Button className="bg-stayoraTeal hover:bg-stayoraTeal/90">View rooms</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
