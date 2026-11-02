import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { audit } from "@/lib/permissions"

const schema = z.object({
  name: z.string().min(2),
  description: z.string().min(20),
  address: z.string().min(3),
  cityId: z.string().min(1),
  pincode: z.string().min(4),
  phone: z.string().min(6),
  email: z.string().email(),
  starRating: z.number().int().min(1).max(5),
  hotelType: z.enum(["LUXURY", "BUSINESS", "RESORT", "HERITAGE", "BUDGET"]),
  checkInTime: z.string().min(4),
  checkOutTime: z.string().min(4),
  gstin: z.string().optional().nullable(),
})

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)
    if (!["HOTEL_OWNER", "ADMIN"].includes(user.role)) {
      return fail("Only property owners can add properties", 403)
    }

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) {
      return fail(parsed.error.issues[0]?.message ?? "Invalid property details")
    }

    const d = parsed.data
    const city = await prisma.city.findUnique({ where: { id: d.cityId } })
    if (!city) return fail("That city doesn't exist in our location list")

    // Slugs must be unique; append a suffix if the base is taken.
    const base = slugify(`${d.name}-${city.name}`)
    let slug = base
    let n = 2
    while (await prisma.hotel.findUnique({ where: { slug } })) {
      slug = `${base}-${n++}`
    }

    const hotel = await prisma.hotel.create({
      data: {
        name: d.name,
        slug,
        description: d.description,
        address: d.address,
        cityId: d.cityId,
        pincode: d.pincode,
        phone: d.phone,
        email: d.email,
        starRating: d.starRating,
        hotelType: d.hotelType,
        checkInTime: d.checkInTime,
        checkOutTime: d.checkOutTime,
        gstin: d.gstin || null,
        ownerId: user.id,
        status: "PENDING_APPROVAL",
      },
    })

    // Seed the property with the standard amenity set so it isn't empty.
    const defaults = await prisma.amenity.findMany({
      where: { name: { in: ["Free WiFi", "Air Conditioning"] } },
    })
    if (defaults.length) {
      await prisma.hotelAmenity.createMany({
        data: defaults.map((a) => ({ hotelId: hotel.id, amenityId: a.id })),
      })
    }

    await audit(user.id, "hotel.create", "Hotel", hotel.id, { name: hotel.name })

    return ok({ id: hotel.id, slug: hotel.slug, status: hotel.status }, 201)
  })
}
