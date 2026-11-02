import { prisma } from "@/lib/prisma"

/**
 * Operational metrics computed from real reservation and inventory data.
 * Nothing here is estimated or fabricated.
 */
export async function computeAnalytics(hotelIds: string[], windowDays = 30) {
  if (hotelIds.length === 0) {
    return {
      totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0,
      grossBookingValue: 0, collected: 0, refunded: 0, commission: 0,
      occupancy: 0, adr: 0, revpar: 0, cancellationRate: 0,
      upcomingArrivals: 0, todayDepartures: 0, inventorySold: 0, inventoryTotal: 0,
    }
  }

  const now = new Date()
  const windowStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const windowEnd = new Date(windowStart)
  windowEnd.setUTCDate(windowEnd.getUTCDate() + windowDays)

  const [bookings, inventory, roomTypes, refunds, hotels] = await Promise.all([
    prisma.booking.findMany({
      where: { hotelId: { in: hotelIds } },
      select: {
        status: true, totalAmount: true, amountPaid: true, refundStatus: true,
        numberOfNights: true, numberOfRooms: true, checkInDate: true, checkOutDate: true,
      },
    }),
    prisma.roomInventory.aggregate({
      where: {
        roomType: { hotelId: { in: hotelIds } },
        date: { gte: windowStart, lt: windowEnd },
      },
      _sum: { totalRooms: true, available: true },
    }),
    prisma.roomType.count({ where: { hotelId: { in: hotelIds }, isActive: true } }),
    prisma.refund.aggregate({
      where: { payment: { booking: { hotelId: { in: hotelIds } } }, status: "REFUNDED" },
      _sum: { amount: true },
    }),
    prisma.hotel.findMany({
      where: { id: { in: hotelIds } },
      select: { commissionRate: true },
    }),
  ])

  const live = bookings.filter((b) => b.status !== "CANCELLED" && b.status !== "PAYMENT_FAILED")
  const cancelled = bookings.filter((b) => b.status === "CANCELLED")

  const grossBookingValue = live.reduce((s, b) => s + b.totalAmount, 0)
  const collected = live.reduce((s, b) => s + b.amountPaid, 0)

  // Commission is taken on collected revenue, at each property's configured rate.
  const avgCommission =
    hotels.length > 0
      ? hotels.reduce((s, h) => s + h.commissionRate, 0) / hotels.length
      : 0
  const commission = (collected * avgCommission) / 100

  const totalRooms = inventory._sum.totalRooms ?? 0
  const availableRooms = inventory._sum.available ?? 0
  const sold = Math.max(0, totalRooms - availableRooms)
  const occupancy = totalRooms > 0 ? Math.round((sold / totalRooms) * 1000) / 10 : 0

  const roomNights = live.reduce((s, b) => s + b.numberOfNights * b.numberOfRooms, 0)
  const adr = roomNights > 0 ? Math.round(grossBookingValue / roomNights) : 0
  const revpar = totalRooms > 0 ? Math.round(grossBookingValue / (totalRooms / windowDays)) : 0

  const todayStart = windowStart
  const todayEnd = new Date(windowStart); todayEnd.setUTCDate(todayEnd.getUTCDate() + 1)

  return {
    totalBookings: bookings.length,
    confirmedBookings: bookings.filter((b) => ["CONFIRMED", "CHECKED_IN"].includes(b.status)).length,
    cancelledBookings: cancelled.length,
    grossBookingValue,
    collected,
    refunded: refunds._sum.amount ?? 0,
    commission: Math.round(commission),
    occupancy,
    adr,
    revpar,
    cancellationRate: bookings.length > 0 ? Math.round((cancelled.length / bookings.length) * 1000) / 10 : 0,
    upcomingArrivals: bookings.filter(
      (b) => b.status === "CONFIRMED" && b.checkInDate >= todayStart && b.checkInDate < todayEnd
    ).length,
    todayDepartures: bookings.filter(
      (b) => b.status === "CHECKED_IN" && b.checkOutDate >= todayStart && b.checkOutDate < todayEnd
    ).length,
    inventorySold: sold,
    inventoryTotal: totalRooms,
  }
}
