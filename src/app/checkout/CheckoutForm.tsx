"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import { ShieldCheck, Tag } from "lucide-react"

type Props = {
  user: { name: string; email: string; phone: string }
  hotel: { id: string; name: string; city: string }
  roomTypeName: string
  roomTypeId: string
  checkIn: string
  checkOut: string
  rooms: number
  adults: number
  children: number
  initialState: { roomCharges: number; taxes: number; total: number }
}

export default function CheckoutForm(props: Props) {
  const router = useRouter()
  const [guestName, setGuestName] = useState(props.user.name)
  const [guestEmail, setGuestEmail] = useState(props.user.email)
  const [guestPhone, setGuestPhone] = useState(props.user.phone)
  const [coupon, setCoupon] = useState("")
  const [couponMsg, setCouponMsg] = useState<string | null>(null)
  const [discount, setDiscount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const taxable = Math.max(0, props.initialState.roomCharges - discount)
  const gstRate = props.initialState.taxes / Math.max(1, props.initialState.roomCharges)
  const taxes = Math.round(taxable * gstRate)
  const total = taxable + taxes

  async function applyCoupon() {
    setCouponMsg(null)
    if (!coupon.trim()) return
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon.trim(), amount: props.initialState.roomCharges }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.valid) {
      setDiscount(data.discount)
      setCouponMsg(`Coupon applied — you save ${formatCurrency(data.discount)}`)
    } else {
      setDiscount(0)
      setCouponMsg(data.error ?? "That coupon isn't valid for this booking")
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: props.hotel.id,
          roomTypeId: props.roomTypeId,
          checkIn: props.checkIn,
          checkOut: props.checkOut,
          rooms: props.rooms,
          adults: props.adults,
          children: props.children,
          guestName,
          guestEmail,
          guestPhone,
          couponCode: discount > 0 ? coupon.trim().toUpperCase() : null,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? "We couldn't complete this booking")
        setSubmitting(false)
        return
      }

      // Send the guest straight to payment; pay-at-hotel is chosen there.
      router.push(`/bookings/${data.bookingId}/payment`)
      router.refresh()
    } catch {
      setError("Network error. Please try again.")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4">Guest details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Full name</label>
              <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Email</label>
              <Input type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Mobile number</label>
              <Input value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="10-digit mobile" required />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Booking for</label>
              <Input value={`${props.rooms} room(s), ${props.adults} adult(s)${props.children ? `, ${props.children} child` : ""}`} readOnly className="bg-warmWhite" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Tag className="h-4 w-4" /> Coupon code
          </h2>
          <div className="flex gap-2">
            <Input
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Try STAYORA10"
              className="uppercase"
            />
            <Button type="button" variant="outline" onClick={applyCoupon}>Apply</Button>
          </div>
          {couponMsg && (
            <p className={`text-sm mt-2 ${discount > 0 ? "text-successGreen" : "text-errorRed"}`}>
              {couponMsg}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-3">Payment</h2>
          <div className="bg-warmWhite border border-border rounded-lg p-4 text-sm">
            <p className="font-medium flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-successGreen" />
              Pay at hotel (demo)
            </p>
            <p className="text-secondaryText mt-1">
              This build records bookings without taking a real payment. Razorpay checkout is wired for
              sandbox keys — add them in <code className="text-xs">.env</code> to enable live card/UPI flow.
              No money is collected.
            </p>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-secondaryText">Room charges</span>
              <span>{formatCurrency(props.initialState.roomCharges)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-successGreen">
                <span>Coupon discount</span>
                <span>−{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-secondaryText">GST</span>
              <span>{formatCurrency(taxes)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base border-t border-border pt-2">
              <span>Total payable</span>
              <span className="text-deepOceanBlue">{formatCurrency(total)}</span>
            </div>
          </div>

          {error && <p className="text-sm text-errorRed mt-3">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full mt-4 bg-coral hover:bg-coral/90" size="lg">
            {submitting ? "Confirming…" : `Confirm booking · ${formatCurrency(total)}`}
          </Button>
          <p className="text-xs text-secondaryText text-center mt-2">
            By confirming you accept the booking and cancellation policy.
          </p>
        </CardContent>
      </Card>
    </form>
  )
}
