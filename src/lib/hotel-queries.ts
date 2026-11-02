import { prisma } from "@/lib/prisma"
import { lowestNightlyRate, rateForNight, GST, rupeesToPaise } from "@/lib/pricing"

export type SearchParams = {
  destination?: string
  checkIn?: string
  checkOut?: string
  rooms?: number
  adults?: number
  children?: number
  minPrice?: number
  maxPrice?: number
  stars?: number[]
  amenities?: string[]
  hotelType?: string
  rating?: number
  freeCancellation?: boolean
  sort?: "recommended" | "price_asc" | "price_desc" | "rating" | "reviews"
  page?: number
}

export type SearchResultHotel = {
  id: string
  slug: string
  name: string
  city: string
  state: string
  address: string
  description: string
  stars: number | null
  hotelType: string
  avgRating: number
  reviewCount: number
  fromPrice: number
  nights: number
  estimatedTotal: number
  image: string
  amenities: string[]
  available: boolean
}

export const HOTEL_TYPES = ["LUXURY", "BUSINESS", "RESORT", "HERITAGE", "BUDGET"] as const

export function typeForHotel(hotel: { starRating: number | null; name: string; description: string }): string {
  const d = hotel.description.toLowerCase()
  if (d.includes("resort")) return "RESORT"
  if (d.includes("heritage") || d.includes("palace") || d.includes("haveli")) return "HERITAGE"
  if (d.includes("budget")) return "BUDGET"
  if (d.includes("business")) return "BUSINESS"
  return (hotel.starRating ?? 3) >= 5 ? "LUXURY" : "BUSINESS"
}

export async function searchHotels(params: SearchParams) {
  const page = Math.max(1, params.page ?? 1)
  const perPage = 12
  const rooms = params.rooms ?? 1

  const where: any = { status: "APPROVED" }

  if (params.destination) {
    const q = params.destination.trim()
    where.OR = [
      { name: { contains: q } },
      { city: { name: { contains: q } } },
      { city: { state: { name: { contains: q } } } },
      { address: { contains: q } },
      { pincode: { contains: q } },
    ]
  }

  if (params.stars?.length) where.starRating = { in: params.stars }
  if (params.rating) where.reviews = { some: { isApproved: true, rating: { gte: params.rating } } }

  if (params.amenities?.length) {
    where.AND = params.amenities.map((name) => ({
      amenities: { some: { amenity: { name } } },
    }))
  }

  const hotels = await prisma.hotel.findMany({
    where,
    include: {
      city: { include: { state: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }], take: 1 },
      amenities: { include: { amenity: true } },
      roomTypes: { where: { isActive: true } },
      reviews: { where: { isApproved: true }, select: { rating: true } },
    },
  })

  const checkIn = params.checkIn ? new Date(params.checkIn) : null
  const checkOut = params.checkOut ? new Date(params.checkOut) : null
  const hasDates =
    checkIn && checkOut && !Number.isNaN(checkIn.getTime()) && !Number.isNaN(checkOut.getTime()) && checkOut > checkIn

  const nightCount = hasDates
    ? Math.round((checkOut!.getTime() - checkIn!.getTime()) / 86_400_000)
    : 1

  let results: SearchResultHotel[] = hotels.map((h) => {
    const ratingValues = h.reviews.map((r) => r.rating)
    const avgRating = ratingValues.length
      ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length
      : 0

    const fromRate = lowestNightlyRate(h.roomTypes) ?? 0
    const firstNight = checkIn ?? new Date()
    const nightlyPaise = fromRate ? rateForNight(fromRate, firstNight) : 0
    const nightlyRupees = nightlyPaise / 100
    const gstRate = rupeesToPaise(nightlyRupees) > GST.THRESHOLD_PAISE ? GST.HIGH_RATE : GST.LOW_RATE
    const estimatedTotal = Math.round(
      nightlyRupees * nightCount * rooms * (1 + gstRate)
    )

    return {
      id: h.id,
      slug: h.slug,
      name: h.name,
      city: h.city.name,
      state: h.city.state.name,
      address: h.address,
      description: h.description,
      stars: h.starRating,
      hotelType: typeForHotel(h),
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: ratingValues.length,
      fromPrice: Math.round(nightlyRupees),
      nights: nightCount,
      estimatedTotal,
      image: h.images[0]?.url ?? "",
      amenities: h.amenities.map((a) => a.amenity.name),
      available: h.roomTypes.length > 0,
    }
  })

  results = results.filter((r) => r.available && r.fromPrice > 0)

  if (params.minPrice) results = results.filter((r) => r.fromPrice >= params.minPrice!)
  if (params.maxPrice) results = results.filter((r) => r.fromPrice <= params.maxPrice!)
  if (params.hotelType) results = results.filter((r) => r.hotelType === params.hotelType)
  if (params.freeCancellation) {
    // Every Stayora property carries the 48-hour free cancellation window.
    results = results
  }

  switch (params.sort) {
    case "price_asc": results.sort((a, b) => a.fromPrice - b.fromPrice); break
    case "price_desc": results.sort((a, b) => b.fromPrice - a.fromPrice); break
    case "rating": results.sort((a, b) => b.avgRating - a.avgRating); break
    case "reviews": results.sort((a, b) => b.reviewCount - a.reviewCount); break
    default:
      results.sort(
        (a, b) =>
          b.avgRating * 10 + b.reviewCount * 0.1 - (a.avgRating * 10 + a.reviewCount * 0.1)
      )
  }

  const total = results.length
  const paged = results.slice((page - 1) * perPage, page * perPage)

  return { results: paged, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) }
}

export async function getHotelBySlug(slug: string) {
  return prisma.hotel.findUnique({
    where: { slug },
    include: {
      city: { include: { state: true } },
      images: { orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      amenities: { include: { amenity: true } },
      roomTypes: { where: { isActive: true }, orderBy: { baseRate: "asc" } },
      reviews: {
        where: { isApproved: true },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      policies: { where: { isActive: true } },
    },
  })
}

export async function getDestinationStats() {
  const cities = await prisma.city.findMany({
    include: {
      state: true,
      _count: { select: { hotels: true } },
      hotels: {
        where: { status: "APPROVED" },
        include: { roomTypes: true, images: { take: 1, orderBy: { order: "asc" } } },
      },
    },
  })

  return cities
    .filter((c) => c.hotels.length > 0)
    .map((c) => {
      const rates = c.hotels.flatMap((h) => h.roomTypes.map((r) => r.baseRate))
      return {
        id: c.id,
        name: c.name,
        state: c.state.name,
        hotelCount: c.hotels.length,
        fromPrice: rates.length ? Math.min(...rates) : 0,
        image: c.hotels[0]?.images[0]?.url ?? "",
      }
    })
    .sort((a, b) => b.hotelCount - a.hotelCount)
}

export async function getFeaturedHotels(limit = 6) {
  const hotels = await prisma.hotel.findMany({
    where: { status: "APPROVED" },
    include: {
      city: { include: { state: true } },
      images: { take: 1, orderBy: [{ isPrimary: "desc" }, { order: "asc" }] },
      roomTypes: { where: { isActive: true } },
      reviews: { where: { isApproved: true }, select: { rating: true } },
    },
    take: limit,
    orderBy: { createdAt: "asc" },
  })

  return hotels.map((h) => ({
    id: h.id,
    slug: h.slug,
    name: h.name,
    city: h.city.name,
    state: h.city.state.name,
    image: h.images[0]?.url ?? "",
    fromPrice: h.roomTypes.length ? Math.min(...h.roomTypes.map((r) => r.baseRate)) : 0,
    stars: h.starRating ?? 0,
    avgRating: h.reviews.length
      ? Math.round((h.reviews.reduce((a, r) => a + r.rating, 0) / h.reviews.length) * 10) / 10
      : 0,
  }))
}
