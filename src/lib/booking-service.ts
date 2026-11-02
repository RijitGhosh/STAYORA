import { prisma } from "@/lib/prisma"
import { computePrice, enumerateNights, countNights } from "@/lib/pricing"

export type BookingErrorCode =
  | "INVALID_DATES"
  | "NOT_FOUND"
  | "NO_INVENTORY"
  | "OCCUPANCY"
  | "ALREADY_CANCELLED"
  | "NOT_CANCELLABLE"
  | "FORBIDDEN"

export class BookingError extends Error {
  code: BookingErrorCode

  constructor(message: string, code: BookingErrorCode = "NOT_FOUND") {
    super(message)
    this.name = "BookingError"
    this.code = code
  }
}

export function bookingReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let out = ""
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return `STY-${out}`
}

export function invoiceNumber(): string {
  const y = new Date().getFullYear()
  const n = Math.floor(Math.random() * 900000) + 100000
  return `INV-${y}-${n}`
}

/** Validate a requested date range against business rules. */
export function validateStay(checkIn: Date, checkOut: Date): void {
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw new BookingError("Invalid check-in or check-out date", "INVALID_DATES")
  }
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  if (checkIn < today) {
    throw new BookingError("Check-in cannot be in the past", "INVALID_DATES")
  }
  const nights = countNights(checkIn, checkOut)
  if (nights < 1) {
    throw new BookingError("Check-out must be after check-in", "INVALID_DATES")
  }
  if (nights > 30) {
    throw new BookingError("Stays are limited to 30 nights", "INVALID_DATES")
  }
}

/**
 * Availability for a room type across a stay.
 *
 * Reads the inventory row for every night and takes the minimum, so a room
 * type is only bookable if it has stock on *every* night requested.
 */
export async function availableRooms(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date
): Promise<number> {
  const nights = enumerateNights(checkIn, checkOut)
  if (nights.length === 0) return 0

  const rows = await prisma.roomInventory.findMany({
    where: {
      roomTypeId,
      date: { gte: nights[0], lte: nights[nights.length - 1] },
    },
    select: { date: true, available: true },
  })

  if (rows.length < nights.length) return 0
  return rows.reduce((min, r) => Math.min(min, r.available), Infinity)
}

export type QuoteLine = {
  roomTypeId: string
  roomTypeName: string
  bedConfiguration: string
  maxOccupancy: number
  rooms: number
  baseRate: number
  available: number
  price: ReturnType<typeof computePrice>
}

/** Server-side quote for every room type at a hotel. */
export async function quoteHotel(params: {
  hotelId: string
  checkIn: Date
  checkOut: Date
  rooms: number
  guests: number
}): Promise<QuoteLine[]> {
  validateStay(params.checkIn, params.checkOut)

  const roomTypes = await prisma.roomType.findMany({
    where: { hotelId: params.hotelId, isActive: true },
    orderBy: { baseRate: "asc" },
  })

  const lines: QuoteLine[] = []

  for (const rt of roomTypes) {
    const available = await availableRooms(rt.id, params.checkIn, params.checkOut)
    if (available < params.rooms) continue
    if (rt.maxOccupancy * params.rooms < params.guests) continue

    lines.push({
      roomTypeId: rt.id,
      roomTypeName: rt.name,
      bedConfiguration: rt.bedConfiguration,
      maxOccupancy: rt.maxOccupancy,
      rooms: params.rooms,
      baseRate: rt.baseRate,
      available,
      price: computePrice({
        baseRate: rt.baseRate,
        checkIn: params.checkIn,
        checkOut: params.checkOut,
        rooms: params.rooms,
      }),
    })
  }

  return lines
}

export type CreateBookingInput = {
  userId: string
  hotelId: string
  roomTypeId: string
  checkIn: Date
  checkOut: Date
  rooms: number
  adults: number
  children: number
  guestName: string
  guestEmail: string
  guestPhone: string
  couponCode?: string | null
}

export type CouponResult = { discount: number; code: string } | null

export async function validateCoupon(
  code: string,
  bookingAmount: number,
  userId: string
): Promise<CouponResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
  if (!coupon || !coupon.isActive) return null

  const now = new Date()
  if (now < coupon.validFrom || now > coupon.validTo) return null
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return null
  if (coupon.minBookingAmount !== null && bookingAmount < coupon.minBookingAmount) return null

  const used = await prisma.couponRedemption.count({
    where: { couponId: coupon.id, userId },
  })
  if (used >= coupon.perUserLimit) return null

  let discount =
    coupon.type === "PERCENTAGE"
      ? Math.round((bookingAmount * coupon.value) / 100)
      : coupon.value

  if (coupon.maxDiscount !== null) {
    discount = Math.min(discount, coupon.maxDiscount)
  }
  discount = Math.min(discount, bookingAmount)

  return { discount, code: coupon.code }
}

/**
 * Create a booking and decrement inventory for every night, atomically.
 *
 * Each nightly decrement uses a conditional update (`available >= rooms`)
 * inside a transaction, so two concurrent bookings for the last room cannot
 * both succeed: the loser's update matches zero rows and throws.
 */
export async function createBooking(input: CreateBookingInput) {
  validateStay(input.checkIn, input.checkOut)

  const hotel = await prisma.hotel.findUnique({
    where: { id: input.hotelId },
    include: { roomTypes: true },
  })
  if (!hotel || hotel.status !== "APPROVED") {
    throw new BookingError("Hotel not found", "NOT_FOUND")
  }

  const roomType = hotel.roomTypes.find((r) => r.id === input.roomTypeId && r.isActive)
  if (!roomType) throw new BookingError("Room type not found", "NOT_FOUND")

  const guests = input.adults + input.children
  if (guests < 1) throw new BookingError("At least one guest is required", "OCCUPANCY")
  if (guests > roomType.maxOccupancy * input.rooms) {
    throw new BookingError(
      `This room type sleeps up to ${roomType.maxOccupancy * input.rooms} guests across ${input.rooms} room(s)`,
      "OCCUPANCY"
    )
  }

  const nights = enumerateNights(input.checkIn, input.checkOut)

  const subtotal = computePrice({
    baseRate: roomType.baseRate,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    rooms: input.rooms,
  })

  let discount = 0
  let couponCode: string | null = null
  if (input.couponCode) {
    const c = await validateCoupon(input.couponCode, subtotal.roomCharges, input.userId)
    if (c) { discount = c.discount; couponCode = c.code }
  }

  const price = computePrice({
    baseRate: roomType.baseRate,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    rooms: input.rooms,
    discountRupees: discount,
  })

  const ref = bookingReference()

  const booking = await prisma.$transaction(async (tx) => {
    // Decrement inventory for each night, guarded by availability.
    for (const night of nights) {
      const updated = await tx.roomInventory.updateMany({
        where: {
          roomTypeId: roomType.id,
          date: night,
          available: { gte: input.rooms },
        },
        data: { available: { decrement: input.rooms } },
      })
      if (updated.count === 0) {
        throw new BookingError(
          "These dates were just taken. Please choose different dates or rooms.",
          "NO_INVENTORY"
        )
      }
    }

    const created = await tx.booking.create({
      data: {
        bookingReference: ref,
        userId: input.userId,
        hotelId: hotel.id,
        checkInDate: input.checkIn,
        checkOutDate: input.checkOut,
        numberOfNights: price.numberOfNights,
        numberOfRooms: input.rooms,
        numberOfAdults: input.adults,
        numberOfChildren: input.children,
        guestName: input.guestName,
        guestEmail: input.guestEmail,
        guestPhone: input.guestPhone,
        status: "CONFIRMED",
        refundStatus: "NOT_APPLICABLE",
        roomCharges: price.roomCharges,
        taxes: price.taxes,
        discounts: price.discounts,
        totalAmount: price.totalAmount,
        amountPaid: 0,
        outstandingAmount: price.totalAmount,
        couponCode,
        policySnapshot: JSON.stringify({
          freeCancellationHours: 48,
          checkInTime: hotel.checkInTime,
          checkOutTime: hotel.checkOutTime,
          gstRate: price.gstRate,
        }),
        cancellationDeadline: new Date(input.checkIn.getTime() - 48 * 3600_000),
        confirmedAt: new Date(),
        items: {
          create: {
            roomTypeId: roomType.id,
            quantity: input.rooms,
            ratePerNight: roomType.baseRate,
            totalAmount: price.roomCharges,
          },
        },
        statusHistory: {
          create: { status: "CONFIRMED", notes: "Booking created" },
        },
      },
    })

    if (couponCode && discount > 0) {
      const coupon = await tx.coupon.findUnique({ where: { code: couponCode } })
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        })
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            bookingId: created.id,
            userId: input.userId,
            discount,
          },
        })
      }
    }

    return created
  })

  return booking
}

const POLICY_HOURS = 48

export function canCancel(booking: {
  status: string
  checkInDate: Date
}): { allowed: boolean; reason?: string } {
  if (!["CONFIRMED", "PENDING", "PENDING_PAYMENT"].includes(booking.status)) {
    return { allowed: false, reason: `A ${booking.status.toLowerCase().replace(/_/g, " ")} booking cannot be cancelled` }
  }
  const deadline = new Date(new Date(booking.checkInDate).getTime() - POLICY_HOURS * 3600_000)
  if (new Date() > deadline) {
    return {
      allowed: false,
      reason: `Free cancellation closed ${POLICY_HOURS} hours before check-in`,
    }
  }
  return { allowed: true }
}

/** Cancel a booking and return its inventory to stock. */
export async function cancelBooking(bookingId: string, userId: string, reason: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { items: true },
  })
  if (!booking) throw new BookingError("Booking not found", "NOT_FOUND")
  if (booking.userId !== userId) throw new BookingError("Not your booking", "FORBIDDEN")

  const check = canCancel(booking)
  if (!check.allowed) throw new BookingError(check.reason!, "NOT_CANCELLABLE")

  const nights = enumerateNights(booking.checkInDate, booking.checkOutDate)

  return prisma.$transaction(async (tx) => {
    for (const night of nights) {
      for (const item of booking.items) {
        await tx.roomInventory.updateMany({
          where: { roomTypeId: item.roomTypeId, date: night },
          data: { available: { increment: item.quantity } },
        })
      }
    }

    const cancelled = await tx.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancellationReason: reason,
        refundStatus: booking.amountPaid > 0 ? "PENDING" : "NOT_APPLICABLE",
        outstandingAmount: 0,
        statusHistory: {
          create: { status: "CANCELLED", notes: reason },
        },
      },
    })

    return cancelled
  })
}
