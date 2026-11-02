"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { UPI_APPS, BANKS, WALLETS, PAYMENT_METHODS, type PaymentMethod } from "@/lib/payments"
import {
  CreditCard, Smartphone, Landmark, Wallet, Building2, CheckCircle,
  XCircle, Loader2, ShieldCheck,
} from "lucide-react"

const ICONS: Record<string, any> = {
  card: CreditCard, upi: Smartphone, bank: Landmark, wallet: Wallet, hotel: Building2,
}

type Previous = {
  id: string
  status: string
  method: string
  amount: number
  reference: string | null
  failureReason: string | null
  createdAt: string
}

export default function PaymentForm({
  bookingId, outstanding, sandbox, previousPayments,
}: {
  bookingId: string
  outstanding: number
  sandbox: boolean
  previousPayments: Previous[]
}) {
  const router = useRouter()
  const [method, setMethod] = useState<PaymentMethod>("UPI")
  const [token, setToken] = useState("")
  const [cardName, setCardName] = useState("")
  const [bank, setBank] = useState(BANKS[0])
  const [wallet, setWallet] = useState(WALLETS[0])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ status: string; reference: string; failureReason: string | null } | null>(null)

  function effectiveToken(): string {
    if (method === "UPI") return token
    if (method === "CARD") return token || (cardName ? `card-${cardName.replace(/\s+/g, "")}` : "")
    if (method === "NETBANKING") return `${bank.replace(/\s+/g, "")}-ref`
    if (method === "WALLET") return `${wallet.replace(/\s+/g, "")}-ref`
    return ""
  }

  async function pay(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setResult(null)
    setBusy(true)

    const res = await fetch(`/api/bookings/${bookingId}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, token: effectiveToken() || undefined }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)

    if (!res.ok) {
      setError(data.error ?? "Payment could not be processed")
      return
    }

    setResult({
      status: data.status,
      reference: data.reference,
      failureReason: data.failureReason ?? null,
    })

    if (data.status === "CAPTURED") {
      router.refresh()
      setTimeout(() => router.push(`/account/bookings/${bookingId}`), 1600)
    }
  }

  if (result) {
    const ok = result.status === "CAPTURED"
    return (
      <Card>
        <CardContent className="p-8 text-center">
          {ok ? (
            <CheckCircle className="h-14 w-14 text-successGreen mx-auto mb-4" />
          ) : (
            <XCircle className="h-14 w-14 text-errorRed mx-auto mb-4" />
          )}
          <h2 className="text-xl font-bold mb-2">
            {ok ? "Payment successful" : "Payment failed"}
          </h2>
          <p className="text-sm text-secondaryText mb-4">
            {ok
              ? `${formatCurrency(outstanding)} received. Redirecting to your booking…`
              : result.failureReason ?? "The payment was declined."}
          </p>
          <div className="bg-warmWhite border border-border rounded-lg p-3 text-sm inline-block">
            <span className="text-secondaryText">Reference </span>
            <span className="font-mono">{result.reference}</span>
          </div>
          {!ok && (
            <div className="mt-5">
              <Button variant="outline" onClick={() => setResult(null)}>Try another method</Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={pay} className="space-y-4">
      <Card>
        <CardContent className="p-5">
          <h2 className="font-semibold mb-3">Choose a payment method</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => {
              const Icon = ICONS[m.icon]
              const active = method === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => { setMethod(m.value); setToken(""); setError("") }}
                  className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-colors ${
                    active ? "border-stayoraTeal bg-stayoraTeal/5" : "border-border hover:bg-warmWhite"
                  }`}
                >
                  <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${active ? "text-stayoraTeal" : "text-secondaryText"}`} />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    <p className="text-[11px] text-secondaryText">{m.description}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-4">
          {method === "UPI" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">UPI ID</label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="yourname@okhdfcbank"
                  autoComplete="off"
                />
                <p className="text-[11px] text-secondaryText mt-1">
                  We verify with your UPI app. No PIN is ever entered on Stayora.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1.5">Or pick an app</p>
                <div className="flex flex-wrap gap-1.5">
                  {UPI_APPS.map((app) => (
                    <span key={app} className="text-[11px] px-2 py-1 rounded-full bg-warmWhite border border-border text-secondaryText">
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {method === "CARD" && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Name on card</label>
                <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="As printed on the card" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Last 4 digits</label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="4242"
                  inputMode="numeric"
                  maxLength={4}
                />
              </div>
              <p className="text-[11px] text-secondaryText">
                Stayora never accepts or stores full card numbers or CVVs. In production the card
                form is rendered by Razorpay&apos;s PCI-compliant checkout.
              </p>
            </>
          )}

          {method === "NETBANKING" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Select your bank</label>
              <select
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white"
              >
                {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {method === "WALLET" && (
            <div>
              <label className="text-sm font-medium mb-2 block">Select your wallet</label>
              <select
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                className="h-10 w-full rounded-md border border-border px-2 text-sm bg-white"
              >
                {WALLETS.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          )}

          {method === "PAY_AT_HOTEL" && (
            <div className="bg-warmWhite border border-border rounded-lg p-3 text-sm">
              <p className="font-medium">Settle at the front desk</p>
              <p className="text-secondaryText text-xs mt-1">
                Your room is held and the balance is collected on arrival. The property may ask for
                a deposit at check-in.
              </p>
            </div>
          )}

          <div className="border-t border-border pt-3 flex justify-between text-base font-semibold">
            <span>Amount due</span>
            <span className="text-deepOceanBlue">{formatCurrency(outstanding)}</span>
          </div>

          {error && <p className="text-sm text-errorRed">{error}</p>}

          <Button type="submit" disabled={busy} className="w-full bg-coral hover:bg-coral/90" size="lg">
            {busy ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing…</>
            ) : method === "PAY_AT_HOTEL" ? (
              "Reserve and pay at hotel"
            ) : (
              `Pay ${formatCurrency(outstanding)}`
            )}
          </Button>

          <p className="text-[11px] text-secondaryText text-center flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            {sandbox
              ? "Sandbox simulation — no real money is transferred"
              : "Secured by Razorpay · PCI DSS compliant"}
          </p>
        </CardContent>
      </Card>

      {previousPayments.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Payment attempts</h3>
            <ul className="divide-y divide-border text-sm">
              {previousPayments.map((p) => (
                <li key={p.id} className="py-2 flex justify-between gap-3">
                  <div>
                    <p>
                      {p.method} · {formatCurrency(p.amount)}
                    </p>
                    <p className="text-[11px] text-secondaryText">
                      {p.reference ?? "—"} · {new Date(p.createdAt).toLocaleString("en-IN")}
                      {p.failureReason ? ` · ${p.failureReason}` : ""}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full self-start ${
                    p.status === "CAPTURED" ? "bg-successGreen/10 text-successGreen"
                    : p.status === "FAILED" ? "bg-errorRed/10 text-errorRed"
                    : "bg-warningAmber/10 text-warningAmber"
                  }`}>
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </form>
  )
}
