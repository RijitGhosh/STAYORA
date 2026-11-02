import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { simulatePayment, validatePaymentToken, maskToken, PaymentMethod } from "@/lib/payments"
import { audit } from "@/lib/permissions"

const schema = z.object({
  method: z.enum(["CARD", "UPI", "NETBANKING", "WALLET", "PAY_AT_HOTEL"]),
  /** Tokenised reference only — never a card number, CVV or UPI PIN. */
  token: z.string().max(120).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  return handle(async () => {
    const { bookingId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Choose a payment method")
    const { method, token } = parsed.data

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } })
    if (!booking) return fail("Booking not found", 404)
    if (booking.userId !== user.id && user.role !== "ADMIN") {
      return fail("This isn't your booking", 403)
    }
    if (booking.status === "CANCELLED") return fail("This booking is cancelled")

    const outstanding = Math.max(0, booking.totalAmount - booking.amountPaid)
    if (outstanding <= 0) return fail("This booking is already paid in full")

    // Method-specific validation before we touch the gateway.
    const tokenError = validatePaymentToken(method as PaymentMethod, token)
    if (tokenError) return fail(tokenError)

    // Idempotency: a retried request with the same token must not double-charge.
    if (token) {
      const masked = maskToken(token)
      const existing = await prisma.payment.findFirst({
        where: {
          bookingId,
          maskedReference: masked,
          status: "CAPTURED",
        },
      })
      if (existing) {
        return fail("This payment reference has already been used for this booking")
      }
    }

    const result = simulatePayment({
      amount: outstanding,
      method: method as PaymentMethod,
      token,
    })

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.payment.create({
        data: {
          bookingId,
          razorpayOrderId: result.orderId,
          razorpayPaymentId: result.paymentId,
          razorpaySignature: result.signature ?? null,
          amount: outstanding,
          currency: "INR",
          status: result.status,
          method,
          provider: result.provider,
          maskedReference: token ? maskToken(token) : null,
          failureReason: result.failureReason ?? null,
          paidAt: result.status === "CAPTURED" ? new Date() : null,
        },
      })

      await tx.paymentEvent.create({
        data: {
          paymentId: created.id,
          eventType: `payment.${result.status.toLowerCase()}`,
          eventId: `${result.paymentId}-${result.status}`,
          payload: JSON.stringify({
            method, status: result.status, amount: outstanding,
            provider: result.provider, reason: result.failureReason ?? null,
          }),
          processed: true,
        },
      })

      if (result.status === "CAPTURED") {
        const paid = booking.amountPaid + outstanding
        await tx.booking.update({
          where: { id: bookingId },
          data: {
            amountPaid: paid,
            outstandingAmount: Math.max(0, booking.totalAmount - paid),
            statusHistory: {
              create: {
                status: booking.status,
                changedBy: user.id,
                notes: `Payment ${outstanding.toFixed(0)} captured via ${method}`,
              },
            },
          },
        })
      }

      return created
    })

    await audit(user.id, `payment.${result.status.toLowerCase()}`, "Payment", payment.id, {
      bookingId, method, amount: outstanding, provider: result.provider,
    })

    return ok({
      status: result.status,
      paymentId: payment.id,
      reference: result.paymentId,
      amount: outstanding,
      method,
      provider: result.provider,
      failureReason: result.failureReason ?? null,
      bookingReference: booking.bookingReference,
    })
  })
}
