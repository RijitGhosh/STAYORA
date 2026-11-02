/**
 * Payment abstraction.
 *
 * Two adapters exist:
 *  - `razorpay` — used when RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are configured.
 *  - `sandbox`  — a deterministic local adapter for development. It simulates
 *    authorisation/capture deterministically from a seed so tests are stable.
 *
 * No card numbers, CVVs or UPI PINs are ever accepted by this server. The
 * checkout UI collects only a payment *method* and a tokenised reference.
 */

export type PaymentMethod =
  | "CARD"
  | "UPI"
  | "NETBANKING"
  | "WALLET"
  | "PAY_AT_HOTEL"

export const PAYMENT_METHODS: {
  value: PaymentMethod
  label: string
  description: string
  icon: string
}[] = [
  { value: "CARD", label: "Card", description: "Credit or debit card", icon: "card" },
  { value: "UPI", label: "UPI", description: "Google Pay, PhonePe, Paytm, BHIM", icon: "upi" },
  { value: "NETBANKING", label: "Net banking", description: "All major Indian banks", icon: "bank" },
  { value: "WALLET", label: "Wallet", description: "Paytm, Amazon Pay, Mobikwik", icon: "wallet" },
  { value: "PAY_AT_HOTEL", label: "Pay at hotel", description: "Settle at the front desk", icon: "hotel" },
]

export const UPI_APPS = ["Google Pay", "PhonePe", "Paytm", "BHIM UPI", "Amazon Pay"]
export const BANKS = [
  "HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank",
  "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda", "Yes Bank",
]
export const WALLETS = ["Paytm", "Amazon Pay", "Mobikwik", "Freecharge"]

export type PaymentResult = {
  status: "CAPTURED" | "FAILED" | "PENDING"
  provider: "razorpay" | "sandbox"
  orderId: string
  paymentId: string
  signature?: string
  method: PaymentMethod
  failureReason?: string
}

export function razorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
}

/** True when the app is running without live payment credentials. */
export function isSandboxMode(): boolean {
  return !razorpayConfigured()
}

function ref(prefix: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let s = ""
  for (let i = 0; i < 14; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `${prefix}_${s}`
}

/**
 * Simulate a gateway call. In sandbox mode the outcome is derived from the
 * payment token so the same input always gives the same result — this makes
 * failures testable without random flakiness.
 *
 * A token containing "fail" always fails; PIN 0000 always fails; otherwise a
 * payment succeeds.
 */
export function simulatePayment(params: {
  amount: number
  method: PaymentMethod
  token?: string
}): PaymentResult {
  const { amount, method, token } = params
  const orderId = ref("order")
  const paymentId = ref("pay")

  if (!Number.isFinite(amount) || amount <= 0) {
    return { status: "FAILED", provider: "sandbox", orderId, paymentId, method, failureReason: "Invalid amount" }
  }

  if (method === "PAY_AT_HOTEL") {
    return { status: "PENDING", provider: "sandbox", orderId, paymentId, method }
  }

  const t = (token ?? "").toLowerCase()
  if (t.includes("fail") || t === "0000") {
    return {
      status: "FAILED",
      provider: "sandbox",
      orderId,
      paymentId,
      method,
      failureReason: "Payment declined by the issuing bank",
    }
  }

  return { status: "CAPTURED", provider: "sandbox", orderId, paymentId, method }
}

/** Validate a method-specific reference without ever storing the raw secret. */
export function validatePaymentToken(method: PaymentMethod, token: string | undefined): string | null {
  if (method === "PAY_AT_HOTEL") return null

  if (!token || token.trim().length < 4) {
    return method === "UPI"
      ? "Enter the UPI ID you're paying from (e.g. name@bank)"
      : "Enter the payment reference from your bank or wallet"
  }

  if (method === "UPI" && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(token.trim())) {
    return "Enter a valid UPI ID, for example name@okhdfcbank"
  }

  return null
}

export function maskToken(token: string): string {
  const t = token.trim()
  if (t.includes("@")) {
    const [user, host] = t.split("@")
    return `${user.slice(0, 2)}***@${host}`
  }
  if (t.length <= 4) return "****"
  return `****${t.slice(-4)}`
}
