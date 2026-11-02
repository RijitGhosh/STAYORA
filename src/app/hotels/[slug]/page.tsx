import { notFound } from "next/navigation"
import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { getHotelBySlug } from "@/lib/hotel-queries"
import { quoteHotel } from "@/lib/booking-service"
import { formatCurrency, formatDate } from "@/lib/utils"
import RoomList from "@/app/hotels/[slug]/RoomList"
import BookingWidget from "@/components/booking/BookingWidget"
import { MapPin, Star, CheckCircle, Clock, Info } from "lucide-react"

export const dynamic = "force-dynamic"

function isoIn(days: number) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length ? v : undefined
}

export default async function HotelPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { slug } = await params
  const sp = await searchParams

  const hotel = await getHotelBySlug(slug)
  if (!hotel || hotel.status !== "APPROVED") notFound()

  const checkIn = str(sp.checkIn) ?? isoIn(1)
  const checkOut = str(sp.checkOut) ?? isoIn(3)
  const rooms = Math.max(1, Number(str(sp.rooms) ?? 1) || 1)
  const adults = Math.max(1, Number(str(sp.adults) ?? 2) || 2)
  const children = Math.max(0, Number(str(sp.children) ?? 0) || 0)

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)

  let lines: Awaited<ReturnType<typeof quoteHotel>> = []
  let quoteError: string | null = null
  try {
    lines = await quoteHotel({
      hotelId: hotel.id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      rooms,
      guests: adults + children,
    })
  } catch (e: any) {
    quoteError = e?.message ?? "Unable to check availability"
  }

  const avgRating = hotel.reviews.length
    ? hotel.reviews.reduce((a, r) => a + r.rating, 0) / hotel.reviews.length
    : 0

  const nights = Math.max(
    0,
    Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86_400_000)
  )

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />

      {/* Gallery */}
      <div className="container mx-auto px-4 pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 h-64 md:h-96">
          {hotel.images.slice(0, 4).map((img, i) => (
            <div
              key={img.id}
              className={`bg-white overflow-hidden rounded-lg ${i === 0 ? "col-span-2 row-span-2" : "hidden md:block"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? hotel.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-border rounded-lg p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-wide text-secondaryText">
                    {hotel.hotelType.toLowerCase()}
                  </span>
                  <h1 className="text-3xl font-bold text-deepOceanBlue">{hotel.name}</h1>
                  <p className="text-secondaryText flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    {hotel.address}, {hotel.city.name}, {hotel.city.state.name} — {hotel.pincode}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {hotel.starRating ? (
                    <span className="flex">
                      {Array.from({ length: hotel.starRating }).map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-goldenYellow text-goldenYellow" />
                      ))}
                    </span>
                  ) : null}
                  {hotel.reviews.length > 0 && (
                    <span className="inline-flex items-center gap-1 bg-successGreen text-white text-sm font-semibold px-2 py-1 rounded">
                      {avgRating.toFixed(1)} · {hotel.reviews.length} reviews
                    </span>
                  )}
                </div>
              </div>

              <p className="text-secondaryText mt-4 leading-relaxed">{hotel.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-6">
                {hotel.amenities.map((a) => (
                  <div key={a.amenityId} className="flex items-center gap-2 text-sm text-primaryText">
                    <CheckCircle className="h-4 w-4 text-successGreen" />
                    {a.amenity.name}
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-6 mt-6 pt-4 border-t border-border text-sm text-secondaryText">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Check-in {hotel.checkInTime}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> Check-out {hotel.checkOutTime}
                </span>
                <span className="flex items-center gap-1">
                  <Info className="h-4 w-4" /> Free cancellation up to 48h before arrival
                </span>
              </div>
            </div>

            <div className="bg-white border border-border rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-1">Rooms & rates</h2>
              <p className="text-sm text-secondaryText mb-4">
                {formatDate(checkInDate)} → {formatDate(checkOutDate)} · {nights} night{nights === 1 ? "" : "s"} ·{" "}
                {rooms} room{rooms === 1 ? "" : "s"} · {adults + children} guest{adults + children === 1 ? "" : "s"}
              </p>

              {quoteError ? (
                <div className="bg-coral/10 border border-coral/30 text-primaryText rounded-lg p-4 text-sm">
                  {quoteError}
                </div>
              ) : lines.length === 0 ? (
                <div className="bg-warmWhite border border-border rounded-lg p-6 text-center">
                  <p className="font-medium mb-1">No rooms available for these dates</p>
                  <p className="text-sm text-secondaryText">
                    Every room type is either fully booked or too small for {adults + children} guests.
                    Try different dates or fewer guests.
                  </p>
                </div>
              ) : (
                <RoomList
                  hotelSlug={hotel.slug}
                  hotelName={hotel.name}
                  lines={lines}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  rooms={rooms}
                  adults={adults}
                  children={children}
                />
              )}
            </div>

            {hotel.reviews.length > 0 && (
              <div className="bg-white border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Guest reviews</h2>
                <div className="space-y-4">
                  {hotel.reviews.map((r) => (
                    <div key={r.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{r.title ?? "Guest review"}</p>
                        <span className="flex">
                          {Array.from({ length: r.rating }).map((_, i) => (
                            <Star key={i} className="h-3.5 w-3.5 fill-goldenYellow text-goldenYellow" />
                          ))}
                        </span>
                      </div>
                      <p className="text-sm text-secondaryText mt-1">{r.comment}</p>
                      <p className="text-xs text-secondaryText mt-2">
                        {r.user.name} · {formatDate(r.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right rail */}
          <aside>
            <div className="bg-white border border-border rounded-lg p-5 sticky top-4">
              <p className="text-sm text-secondaryText">From</p>
              <p className="text-3xl font-bold text-deepOceanBlue">
                {formatCurrency(
                  hotel.roomTypes.length ? Math.min(...hotel.roomTypes.map((r) => r.baseRate)) : 0
                )}
                <span className="text-sm font-normal text-secondaryText"> / night</span>
              </p>
              <p className="text-xs text-secondaryText mt-1">
                Excluding taxes · starting rate
              </p>

              <div className="mt-4">
                <BookingWidget
                  hotelSlug={hotel.slug}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  rooms={rooms}
                  adults={adults}
                  children={children}
                  maxGuestsPerRoom={Math.max(...hotel.roomTypes.map((r) => r.maxOccupancy), 2)}
                  basePrice={hotel.roomTypes.length ? Math.min(...hotel.roomTypes.map((r) => r.baseRate)) : 0}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  )
}
