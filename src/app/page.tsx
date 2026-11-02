import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Star, ShieldCheck, CreditCard, MapPin, Search, ArrowRight, Building2 } from "lucide-react"
import { getDestinationStats, getFeaturedHotels, searchHotels } from "@/lib/hotel-queries"
import { formatCurrency } from "@/lib/utils"
import HomeSearchBar from "@/app/HomeSearchBar"
import { Suspense } from "react"

export const dynamic = "force-dynamic"

export default async function Home() {
  const [destinations, featured, beach, hill, heritage, budget] = await Promise.all([
    getDestinationStats(),
    getFeaturedHotels(6),
    searchHotels({ hotelType: "RESORT", sort: "rating" }),
    searchHotels({ destination: "Shimla", sort: "rating" }),
    searchHotels({ hotelType: "HERITAGE", sort: "rating" }),
    searchHotels({ hotelType: "BUDGET", sort: "price_asc" }),
  ])

  const topDestinations = destinations.slice(0, 8)
  const collections = [
    { title: "Beach resorts", href: "/search?type=RESORT", hotels: beach.results.slice(0, 3), accent: "text-coral" },
    { title: "Hill stations", href: "/search?destination=Shimla", hotels: hill.results.slice(0, 3), accent: "text-stayoraTeal" },
    { title: "Heritage stays", href: "/search?type=HERITAGE", hotels: heritage.results.slice(0, 3), accent: "text-warningAmber" },
    { title: "Budget-friendly", href: "/search?type=BUDGET&sort=price_asc", hotels: budget.results.slice(0, 3), accent: "text-successGreen" },
  ]

  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />

      {/* Hero */}
      <section className="relative bg-deepOceanBlue">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80"
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deepOceanBlue/85 via-deepOceanBlue/70 to-deepOceanBlue/95" />
        </div>

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
              Every Stay, A Better Story
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8">
              {destinations.length} cities. {destinations.reduce((n, d) => n + d.hotelCount, 0)} hotels.
              Transparent prices in rupees, free cancellation, and a dashboard for every booking.
            </p>
          </div>

          <div className="max-w-5xl">
            <Suspense fallback={<div className="h-24 bg-white rounded-lg" />}>
              <HomeSearchBar />
            </Suspense>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {["Goa", "Jaipur", "Munnar", "Udaipur", "Shimla"].map((d) => (
              <Link
                key={d}
                href={`/search?destination=${d}`}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 border border-white/25 text-white hover:bg-white/20"
              >
                {d}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-successGreen shrink-0" />
              <span>Free cancellation up to 48h</span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-stayoraTeal shrink-0" />
              <span>Prices include GST</span>
            </div>
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-coral shrink-0" />
              <span>Verified properties</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-warningAmber shrink-0" />
              <span>Across 16 states</span>
            </div>
          </div>
        </div>
      </section>

      {/* Destinations */}
      <section className="container mx-auto px-4 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Popular destinations</h2>
            <p className="text-secondaryText text-sm mt-1">Where travellers are booking across India</p>
          </div>
          <Link href="/search" className="text-sm text-stayoraTeal hover:underline hidden sm:flex items-center gap-1">
            See all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {topDestinations.map((d) => (
            <Link key={d.id} href={`/search?destination=${encodeURIComponent(d.name)}`}>
              <div className="group relative rounded-lg overflow-hidden h-44 bg-deepOceanBlue">
                {d.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.image}
                    alt={d.name}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-85 group-hover:scale-105 transition-all"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                <div className="absolute bottom-0 p-3 text-white">
                  <p className="font-semibold">{d.name}</p>
                  <p className="text-xs text-gray-200">
                    {d.state} · {d.hotelCount} hotel{d.hotelCount === 1 ? "" : "s"}
                  </p>
                  <p className="text-xs text-brightTeal">from {formatCurrency(d.fromPrice)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured */}
      <section className="bg-white py-14 border-y border-border">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-1">Highest rated stays</h2>
          <p className="text-secondaryText text-sm mb-6">Based on real reviews from guests who completed their stay</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {featured.map((h) => (
              <Link key={h.id} href={`/hotels/${h.slug}`}>
                <div className="group rounded-lg overflow-hidden border border-border bg-white hover:shadow-md transition-shadow h-full flex flex-col">
                  <div className="h-44 overflow-hidden bg-warmWhite">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.image} alt={h.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-deepOceanBlue truncate">{h.name}</p>
                        <p className="text-xs text-secondaryText">{h.city}, {h.state}</p>
                      </div>
                      {h.avgRating > 0 && (
                        <span className="inline-flex items-center gap-1 bg-successGreen text-white text-xs font-semibold px-1.5 py-0.5 rounded shrink-0">
                          <Star className="h-3 w-3 fill-white" />
                          {h.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                    <p className="mt-auto pt-3 text-sm">
                      <span className="text-lg font-bold text-deepOceanBlue">{formatCurrency(h.fromPrice)}</span>
                      <span className="text-secondaryText"> / night</span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      {collections.map((c) => (
        <section key={c.title} className="container mx-auto px-4 py-10">
          <div className="flex items-end justify-between mb-5">
            <h2 className={`text-xl font-bold ${c.accent}`}>{c.title}</h2>
            <Link href={c.href} className="text-sm text-stayoraTeal hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {c.hotels.map((h) => (
              <Link key={h.id} href={`/hotels/${h.slug}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
                  <div className="h-36 overflow-hidden bg-warmWhite">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.image} alt={h.name} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-4">
                    <p className="font-semibold text-deepOceanBlue truncate">{h.name}</p>
                    <p className="text-xs text-secondaryText">{h.city}, {h.state}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-semibold text-deepOceanBlue">{formatCurrency(h.fromPrice)}<span className="text-xs font-normal text-secondaryText"> /night</span></span>
                      {h.avgRating > 0 && (
                        <span className="text-xs flex items-center gap-1 text-secondaryText">
                          <Star className="h-3 w-3 fill-goldenYellow text-goldenYellow" />
                          {h.avgRating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {/* CTA */}
      <section className="bg-stayoraTeal py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Own a property in India?</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            List on Stayora and manage inventory, rates, reservations, check-in and billing from one dashboard.
          </p>
          <Link href="/register">
            <Button className="bg-white text-stayoraTeal hover:bg-warmWhite">
              Become a partner
              <Search className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
