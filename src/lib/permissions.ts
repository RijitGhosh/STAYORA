import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/auth"
import { redirect } from "next/navigation"

export type SessionUser = {
  id: string
  name: string
  email: string
  role: string
}

export class AuthzError extends Error {
  status: number
  constructor(message: string, status = 403) {
    super(message)
    this.name = "AuthzError"
    this.status = status
  }
}

/**
 * All hotels a user can operate, by role.
 *
 * Returns a normalised shape so callers never depend on Prisma's inferred
 * type for a union of three different queries.
 */
export type AccessibleHotel = { id: string; name: string; slug: string; status: string; ownerId: string }

export async function accessibleHotels(user: SessionUser): Promise<AccessibleHotel[]> {
  const select = { id: true, name: true, slug: true, status: true, ownerId: true } as const

  if (user.role === "ADMIN") {
    return prisma.hotel.findMany({ select, orderBy: { name: "asc" } })
  }
  if (user.role === "HOTEL_OWNER") {
    return prisma.hotel.findMany({ where: { ownerId: user.id }, select, orderBy: { name: "asc" } })
  }
  const memberships = await prisma.hotelStaffMembership.findMany({
    where: { userId: user.id },
    select: { hotel: { select } },
  })
  return memberships.map((m) => m.hotel)
}

/** Assert the user may manage this hotel. Returns the hotel. */
export async function requireHotelAccess(user: SessionUser, hotelId: string) {
  const hotel = await prisma.hotel.findUnique({ where: { id: hotelId } })
  if (!hotel) throw new AuthzError("Hotel not found", 404)

  if (user.role === "ADMIN") return hotel
  if (hotel.ownerId === user.id) return hotel

  const membership = await prisma.hotelStaffMembership.findUnique({
    where: { hotelId_userId: { hotelId, userId: user.id } },
  })
  if (!membership) throw new AuthzError("You don't have access to this property")

  return hotel
}

/** Roles that may change inventory, rates and room configuration. */
const MANAGE_ROLES = ["ADMIN", "HOTEL_OWNER"]
const OPS_ROLES = ["ADMIN", "HOTEL_OWNER", "RECEPTIONIST", "FINANCE"]
const HOUSEKEEPING_ROLES = ["ADMIN", "HOTEL_OWNER", "RECEPTIONIST", "HOUSEKEEPING"]

export async function requireManager(user: SessionUser, hotelId: string) {
  const hotel = await requireHotelAccess(user, hotelId)
  if (!MANAGE_ROLES.includes(user.role)) {
    const m = await prisma.hotelStaffMembership.findUnique({
      where: { hotelId_userId: { hotelId, userId: user.id } },
    })
    if (!m || !["MANAGER"].includes(m.role)) {
      throw new AuthzError("Only property owners and managers can change this")
    }
  }
  return hotel
}

export async function requireOperations(user: SessionUser, hotelId: string) {
  const hotel = await requireHotelAccess(user, hotelId)
  if (!OPS_ROLES.includes(user.role)) {
    const m = await prisma.hotelStaffMembership.findUnique({
      where: { hotelId_userId: { hotelId, userId: user.id } },
    })
    if (!m || !["MANAGER", "RECEPTION", "FINANCE"].includes(m.role)) {
      throw new AuthzError("Your role can't perform front-desk operations")
    }
  }
  return hotel
}

export async function requireHousekeeping(user: SessionUser, hotelId: string) {
  const hotel = await requireHotelAccess(user, hotelId)
  if (!HOUSEKEEPING_ROLES.includes(user.role)) {
    const m = await prisma.hotelStaffMembership.findUnique({
      where: { hotelId_userId: { hotelId, userId: user.id } },
    })
    if (!m) throw new AuthzError("Your role can't update housekeeping")
  }
  return hotel
}

export function requireAdmin(user: SessionUser) {
  if (user.role !== "ADMIN") throw new AuthzError("Administrators only")
}

/* ---------------- page-level guards ---------------- */

export async function pageUser(callbackUrl: string): Promise<SessionUser> {
  const user = await getCurrentUser()
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export async function pageAdmin(callbackUrl = "/admin"): Promise<SessionUser> {
  const user = await pageUser(callbackUrl)
  if (user.role !== "ADMIN") redirect("/access-denied")
  return user
}

export async function pageStaff(callbackUrl: string): Promise<SessionUser> {
  const user = await pageUser(callbackUrl)
  if (!["ADMIN", "HOTEL_OWNER", "RECEPTIONIST", "FINANCE", "HOUSEKEEPING"].includes(user.role)) {
    const memberships = await prisma.hotelStaffMembership.count({ where: { userId: user.id } })
    if (memberships === 0) redirect("/access-denied")
  }
  return user
}

/** Log an admin/manager action for the audit trail. */
export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  details: unknown
) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      entity,
      entityId,
      details: typeof details === "string" ? details : JSON.stringify(details),
    },
  })
}
