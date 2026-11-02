import { Suspense } from "react"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { searchHotels } from "@/lib/hotel-queries"
import SearchFilters from "@/app/search/SearchFilters"
import HotelCard from "@/app/search/HotelCard"
import SearchBar from "@/app/search/SearchBar"
import Link from "next/link"

export const dynamic = "force-dynamic"

type SP = Record<string, string | string[] | undefined>

function num(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string") return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}
function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.length ? v : undefined
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SP>
}) {
  const sp = await searchParams
  const destination = str(sp.destination)
  const checkIn = str(sp.checkIn)
  const checkOut = str(sp.checkOut)
  const rooms = num(sp.rooms) ?? 1
  const adults = num(sp.adults) ?? 2
  const children = num(sp.children) ?? 0

  const stars = (str(sp.stars) ?? "")
    .split(",")
    .map(Number)
    .filter((n) => n >= 1 && n <= 5)

  const amenities = (str(sp.amenities) ?? "").split(",").filter(Boolean)

  const { results, total, page, pages } = await searchHotels({
    destination,
    checkIn,
    checkOut,
    rooms,
    adults,
    children,
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    stars,
    amenities,
    hotelType: str(sp.type),
    rating: num(sp.rating),
    freeCancellation: sp.freeCancellation === "1",
    sort: (str(sp.sort) as any) ?? "recommended",
    page: num(sp.page) ?? 1,
  })

  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000))
      : 1

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />

      <div className="bg-deepOceanBlue text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-white mb-1">
            {destination ? `Hotels in ${destination}` : "All hotels across India"}
          </h1>
          <p className="text-sm text-gray-300">
            {total} {total === 1 ? "property" : "properties"}
            {rooms ? ` · ${rooms} room${rooms > 1 ? "s" : ""}` : ""}
            {nights > 1 ? ` · ${nights} nights` : ""}
          </p>
          <div className="mt-4">
            <Suspense fallback={null}>
              <SearchBar />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside>
            <Suspense fallback={null}>
              <SearchFilters />
            </Suspense>
          </aside>

          <div className="lg:col-span-3">
            {results.length === 0 ? (
              <div className="bg-white border border-border rounded-lg p-10 text-center">
                <h2 className="text-lg font-semibold mb-2">No hotels match these filters</h2>
                <p className="text-secondaryText mb-4">
                  Try widening the price range, removing a filter, or searching a nearby city.
                </p>
                <Link href="/search" className="text-stayoraTeal font-medium hover:underline">
                  Clear all filters
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((h) => (
                  <HotelCard
                    key={h.id}
                    hotel={h}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    rooms={rooms}
                    adults={adults}
                    children={children}
                  />
                ))}
              </div>
            )}

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
                  const qs = new URLSearchParams()
                  Object.entries(sp).forEach(([k, v]) => {
                    if (typeof v === "string" && k !== "page") qs.set(k, v)
                  })
                  qs.set("page", String(p))
                  return (
                    <Link
                      key={p}
                      href={`/search?${qs.toString()}`}
                      className={`h-9 min-w-9 px-3 inline-flex items-center justify-center rounded-md border text-sm ${
                        p === page
                          ? "bg-stayoraTeal text-white border-stayoraTeal"
                          : "bg-white border-border hover:bg-warmWhite"
                      }`}
                    >
                      {p}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
