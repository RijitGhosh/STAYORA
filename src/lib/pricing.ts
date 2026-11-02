/**
 * Server-authoritative pricing.
 *
 * All money is handled as integer paise internally to avoid floating point
 * drift, then converted back to rupees at the boundary. Amounts in the
 * database are stored as rupees (Float) for readability, but every
 * computation goes through paise.
 */

export const GST = {
  /** Rooms priced at or below ₹7,500/night: 12% GST */
  LOW_RATE: 0.12,
  /** Rooms above ₹7,500/night: 18% GST */
  HIGH_RATE: 0.18,
  THRESHOLD_PAISE: 750_000,
} as const

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100)
}

export function paiseToRupees(paise: number): number {
  return Math.round(paise) / 100
}

export type NightPrice = {
  date: string
  ratePaise: number
  isWeekend: boolean
}

export type PriceBreakdown = {
  nights: NightPrice[]
  numberOfNights: number
  numberOfRooms: number
  roomCharges: number
  taxes: number
  discounts: number
  totalAmount: number
  advanceDue: number
  outstanding: number
  gstRate: number
}

/** Fri & Sat nights carry a 15% premium — a common Indian leisure pattern. */
export function isWeekendNight(d: Date): boolean {
  const day = d.getDay()
  return day === 5 || day === 6
}

export const WEEKEND_PREMIUM = 0.15

/**
 * Enumerate the nights between check-in and check-out.
 * A stay of 25th → 27th is 2 nights: the 25th and the 26th.
 */
export function enumerateNights(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = []
  const cursor = new Date(checkIn)
  cursor.setUTCHours(0, 0, 0, 0)
  const end = new Date(checkOut)
  end.setUTCHours(0, 0, 0, 0)

  while (cursor < end) {
    nights.push(new Date(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return nights
}

export function countNights(checkIn: Date, checkOut: Date): number {
  const a = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate())
  const b = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate())
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

export function rateForNight(baseRate: number, date: Date): number {
  const paise = rupeesToPaise(baseRate)
  return isWeekendNight(date) ? Math.round(paise * (1 + WEEKEND_PREMIUM)) : paise
}

/**
 * GST is applied per the actual nightly rate band used by Indian hotels:
 * 12% up to ₹7,500 a night, 18% above. We use the highest applicable band
 * across the stay so the quote never under-collects.
 */
export function gstRateForNightlyRate(nightlyRupees: number): number {
  return rupeesToPaise(nightlyRupees) > GST.THRESHOLD_PAISE ? GST.HIGH_RATE : GST.LOW_RATE
}

export function computePrice(params: {
  baseRate: number
  checkIn: Date
  checkOut: Date
  rooms: number
  /** Flat rupee discount already validated server-side. */
  discountRupees?: number
}): PriceBreakdown {
  const { baseRate, checkIn, checkOut, rooms } = params
  const nightDates = enumerateNights(checkIn, checkOut)

  const nights: NightPrice[] = nightDates.map((d) => ({
    date: d.toISOString().slice(0, 10),
    ratePaise: rateForNight(baseRate, d),
    isWeekend: isWeekendNight(d),
  }))

  const roomChargesPaise = nights.reduce((sum, n) => sum + n.ratePaise * rooms, 0)

  const highestNightly = nights.reduce(
    (max, n) => Math.max(max, n.ratePaise / 100),
    baseRate
  )
  const gstRate = gstRateForNightlyRate(highestNightly)

  const discountPaise = Math.min(
    rupeesToPaise(params.discountRupees ?? 0),
    roomChargesPaise
  )
  const taxablePaise = roomChargesPaise - discountPaise
  const taxesPaise = Math.round(taxablePaise * gstRate)
  const totalPaise = taxablePaise + taxesPaise

  return {
    nights,
    numberOfNights: nights.length,
    numberOfRooms: rooms,
    roomCharges: paiseToRupees(roomChargesPaise),
    taxes: paiseToRupees(taxesPaise),
    discounts: paiseToRupees(discountPaise),
    totalAmount: paiseToRupees(totalPaise),
    advanceDue: paiseToRupees(totalPaise),
    outstanding: 0,
    gstRate,
  }
}

/** Cheapest available nightly rate for a hotel across the requested stay. */
export function lowestNightlyRate(
  roomTypes: { baseRate: number; name: string }[]
): number | null {
  if (roomTypes.length === 0) return null
  return Math.min(...roomTypes.map((r) => r.baseRate))
}
