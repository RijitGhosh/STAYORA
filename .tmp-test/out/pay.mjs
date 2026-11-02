// .tmp-test/pay.ts
import { PrismaClient as PrismaClient2 } from "@prisma/client";

// src/lib/payments.ts
function razorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}
function isSandboxMode() {
  return !razorpayConfigured();
}
function ref(prefix) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 14; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${prefix}_${s}`;
}
function simulatePayment(params) {
  const { amount, method, token } = params;
  const orderId = ref("order");
  const paymentId = ref("pay");
  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: "FAILED", provider: "sandbox", orderId, paymentId, method, failureReason: "Invalid amount" };
  }
  if (method === "PAY_AT_HOTEL") {
    return { status: "PENDING", provider: "sandbox", orderId, paymentId, method };
  }
  const t = (token ?? "").toLowerCase();
  if (t.includes("fail") || t === "0000") {
    return {
      status: "FAILED",
      provider: "sandbox",
      orderId,
      paymentId,
      method,
      failureReason: "Payment declined by the issuing bank"
    };
  }
  return { status: "CAPTURED", provider: "sandbox", orderId, paymentId, method };
}
function validatePaymentToken(method, token) {
  if (method === "PAY_AT_HOTEL") return null;
  if (!token || token.trim().length < 4) {
    return method === "UPI" ? "Enter the UPI ID you're paying from (e.g. name@bank)" : "Enter the payment reference from your bank or wallet";
  }
  if (method === "UPI" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(token.trim())) {
    return "Enter a valid UPI ID, for example name@okhdfcbank";
  }
  return null;
}

// src/lib/prisma.ts
import { PrismaClient } from "@prisma/client";
var globalForPrisma = globalThis;
var prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// src/lib/pricing.ts
var GST = {
  /** Rooms priced at or below ₹7,500/night: 12% GST */
  LOW_RATE: 0.12,
  /** Rooms above ₹7,500/night: 18% GST */
  HIGH_RATE: 0.18,
  THRESHOLD_PAISE: 75e4
};
function rupeesToPaise(rupees) {
  return Math.round(rupees * 100);
}
function paiseToRupees(paise) {
  return Math.round(paise) / 100;
}
function isWeekendNight(d2) {
  const day = d2.getDay();
  return day === 5 || day === 6;
}
var WEEKEND_PREMIUM = 0.15;
function enumerateNights(checkIn, checkOut) {
  const nights = [];
  const cursor = new Date(checkIn);
  cursor.setUTCHours(0, 0, 0, 0);
  const end = new Date(checkOut);
  end.setUTCHours(0, 0, 0, 0);
  while (cursor < end) {
    nights.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
}
function countNights(checkIn, checkOut) {
  const a = Date.UTC(checkIn.getUTCFullYear(), checkIn.getUTCMonth(), checkIn.getUTCDate());
  const b = Date.UTC(checkOut.getUTCFullYear(), checkOut.getUTCMonth(), checkOut.getUTCDate());
  return Math.max(0, Math.round((b - a) / 864e5));
}
function rateForNight(baseRate, date) {
  const paise = rupeesToPaise(baseRate);
  return isWeekendNight(date) ? Math.round(paise * (1 + WEEKEND_PREMIUM)) : paise;
}
function gstRateForNightlyRate(nightlyRupees) {
  return rupeesToPaise(nightlyRupees) > GST.THRESHOLD_PAISE ? GST.HIGH_RATE : GST.LOW_RATE;
}
function computePrice(params) {
  const { baseRate, checkIn, checkOut, rooms } = params;
  const nightDates = enumerateNights(checkIn, checkOut);
  const nights = nightDates.map((d2) => ({
    date: d2.toISOString().slice(0, 10),
    ratePaise: rateForNight(baseRate, d2),
    isWeekend: isWeekendNight(d2)
  }));
  const roomChargesPaise = nights.reduce((sum, n) => sum + n.ratePaise * rooms, 0);
  const highestNightly = nights.reduce(
    (max, n) => Math.max(max, n.ratePaise / 100),
    baseRate
  );
  const gstRate = gstRateForNightlyRate(highestNightly);
  const discountPaise = Math.min(
    rupeesToPaise(params.discountRupees ?? 0),
    roomChargesPaise
  );
  const taxablePaise = roomChargesPaise - discountPaise;
  const taxesPaise = Math.round(taxablePaise * gstRate);
  const totalPaise = taxablePaise + taxesPaise;
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
    gstRate
  };
}

// src/lib/booking-service.ts
var BookingError = class extends Error {
  constructor(message, code = "NOT_FOUND") {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
};
function bookingReference() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `STY-${out}`;
}
function validateStay(checkIn, checkOut) {
  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    throw new BookingError("Invalid check-in or check-out date", "INVALID_DATES");
  }
  const today = /* @__PURE__ */ new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (checkIn < today) {
    throw new BookingError("Check-in cannot be in the past", "INVALID_DATES");
  }
  const nights = countNights(checkIn, checkOut);
  if (nights < 1) {
    throw new BookingError("Check-out must be after check-in", "INVALID_DATES");
  }
  if (nights > 30) {
    throw new BookingError("Stays are limited to 30 nights", "INVALID_DATES");
  }
}
async function validateCoupon(code, bookingAmount, userId) {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (!coupon || !coupon.isActive) return null;
  const now = /* @__PURE__ */ new Date();
  if (now < coupon.validFrom || now > coupon.validTo) return null;
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return null;
  if (coupon.minBookingAmount !== null && bookingAmount < coupon.minBookingAmount) return null;
  const used = await prisma.couponRedemption.count({
    where: { couponId: coupon.id, userId }
  });
  if (used >= coupon.perUserLimit) return null;
  let discount = coupon.type === "PERCENTAGE" ? Math.round(bookingAmount * coupon.value / 100) : coupon.value;
  if (coupon.maxDiscount !== null) {
    discount = Math.min(discount, coupon.maxDiscount);
  }
  discount = Math.min(discount, bookingAmount);
  return { discount, code: coupon.code };
}
async function createBooking(input) {
  validateStay(input.checkIn, input.checkOut);
  const hotel = await prisma.hotel.findUnique({
    where: { id: input.hotelId },
    include: { roomTypes: true }
  });
  if (!hotel || hotel.status !== "APPROVED") {
    throw new BookingError("Hotel not found", "NOT_FOUND");
  }
  const roomType = hotel.roomTypes.find((r) => r.id === input.roomTypeId && r.isActive);
  if (!roomType) throw new BookingError("Room type not found", "NOT_FOUND");
  const guests = input.adults + input.children;
  if (guests < 1) throw new BookingError("At least one guest is required", "OCCUPANCY");
  if (guests > roomType.maxOccupancy * input.rooms) {
    throw new BookingError(
      `This room type sleeps up to ${roomType.maxOccupancy * input.rooms} guests across ${input.rooms} room(s)`,
      "OCCUPANCY"
    );
  }
  const nights = enumerateNights(input.checkIn, input.checkOut);
  const subtotal = computePrice({
    baseRate: roomType.baseRate,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    rooms: input.rooms
  });
  let discount = 0;
  let couponCode = null;
  if (input.couponCode) {
    const c = await validateCoupon(input.couponCode, subtotal.roomCharges, input.userId);
    if (c) {
      discount = c.discount;
      couponCode = c.code;
    }
  }
  const price = computePrice({
    baseRate: roomType.baseRate,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    rooms: input.rooms,
    discountRupees: discount
  });
  const ref2 = bookingReference();
  const booking = await prisma.$transaction(async (tx) => {
    for (const night of nights) {
      const updated = await tx.roomInventory.updateMany({
        where: {
          roomTypeId: roomType.id,
          date: night,
          available: { gte: input.rooms }
        },
        data: { available: { decrement: input.rooms } }
      });
      if (updated.count === 0) {
        throw new BookingError(
          "These dates were just taken. Please choose different dates or rooms.",
          "NO_INVENTORY"
        );
      }
    }
    const created = await tx.booking.create({
      data: {
        bookingReference: ref2,
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
          gstRate: price.gstRate
        }),
        cancellationDeadline: new Date(input.checkIn.getTime() - 48 * 36e5),
        confirmedAt: /* @__PURE__ */ new Date(),
        items: {
          create: {
            roomTypeId: roomType.id,
            quantity: input.rooms,
            ratePerNight: roomType.baseRate,
            totalAmount: price.roomCharges
          }
        },
        statusHistory: {
          create: { status: "CONFIRMED", notes: "Booking created" }
        }
      }
    });
    if (couponCode && discount > 0) {
      const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
      if (coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
        await tx.couponRedemption.create({
          data: {
            couponId: coupon.id,
            bookingId: created.id,
            userId: input.userId,
            discount
          }
        });
      }
    }
    return created;
  });
  return booking;
}

// .tmp-test/pay.ts
var p = new PrismaClient2();
var d = (n) => {
  const x = /* @__PURE__ */ new Date();
  x.setUTCHours(0, 0, 0, 0);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
};
async function main() {
  console.log("sandbox mode:", isSandboxMode());
  const hotel = await p.hotel.findFirst({ where: { name: "The Imperial Meridian" }, include: { roomTypes: true } });
  const u = await p.user.findUnique({ where: { email: "customer@stayora.com" } });
  console.log("\n--- payment token validation ---");
  console.log("UPI valid:", validatePaymentToken("UPI", "ananya@okhdfcbank") === null);
  console.log("UPI invalid rejected:", validatePaymentToken("UPI", "notanid") !== null);
  console.log("empty token rejected:", validatePaymentToken("CARD", "") !== null);
  console.log("pay at hotel needs no token:", validatePaymentToken("PAY_AT_HOTEL", void 0) === null);
  console.log("\n--- method simulation ---");
  for (const m of ["CARD", "UPI", "NETBANKING", "WALLET", "PAY_AT_HOTEL"]) {
    const r = simulatePayment({ amount: 5e3, method: m, token: m === "UPI" ? "x@bank" : "ref1234" });
    console.log(`  ${m.padEnd(14)} \u2192 ${r.status}`);
  }
  const fail = simulatePayment({ amount: 5e3, method: "CARD", token: "fail-card" });
  console.log("  failure path   \u2192", fail.status, "|", fail.failureReason);
  console.log("\n--- book + pay ---");
  const b = await createBooking({
    userId: u.id,
    hotelId: hotel.id,
    roomTypeId: hotel.roomTypes[0].id,
    checkIn: d(6),
    checkOut: d(8),
    rooms: 1,
    adults: 2,
    children: 0,
    guestName: "Ananya Iyer",
    guestEmail: "customer@stayora.com",
    guestPhone: "9000000003"
  });
  console.log("booking:", b.bookingReference, "| total", b.totalAmount, "| paid", b.amountPaid);
  const sim = simulatePayment({ amount: b.totalAmount, method: "UPI", token: "ananya@okhdfcbank" });
  const pay = await p.payment.create({ data: {
    bookingId: b.id,
    razorpayOrderId: sim.orderId,
    razorpayPaymentId: sim.paymentId,
    amount: b.totalAmount,
    status: sim.status,
    method: "UPI",
    provider: sim.provider,
    maskedReference: "an***@okhdfcbank",
    paidAt: sim.status === "CAPTURED" ? /* @__PURE__ */ new Date() : null
  } });
  const paid = await p.booking.update({ where: { id: b.id }, data: {
    amountPaid: sim.status === "CAPTURED" ? b.totalAmount : 0,
    outstandingAmount: sim.status === "CAPTURED" ? 0 : b.totalAmount,
    status: "CONFIRMED"
  } });
  console.log("payment row:", pay.status, "| booking paid:", paid.amountPaid, "| outstanding:", paid.outstandingAmount);
  const reread = await p.payment.findUnique({ where: { id: pay.id } });
  console.log("stored masked ref:", reread.maskedReference, "| raw UPI stored?", reread.maskedReference?.includes("@okhdfcbank") ? "no user part stored" : "n/a");
  await p.payment.deleteMany({ where: { bookingId: b.id } });
  await p.bookingItem.deleteMany({ where: { bookingId: b.id } });
  await p.bookingStatusHistory.deleteMany({ where: { bookingId: b.id } });
  await p.booking.delete({ where: { id: b.id } });
  console.log("\ncleanup ok");
}
main().catch((e) => {
  console.error("ERR", e.message);
}).finally(() => p.$disconnect());
