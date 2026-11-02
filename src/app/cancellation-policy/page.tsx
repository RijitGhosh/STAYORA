import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, XCircle } from "lucide-react"

export const metadata = { title: "Cancellation & Refund Policy — Stayora" }

export default function CancellationPage() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Cancellation &amp; refund policy</h1>
        <p className="text-secondaryText mb-8">
          The same policy applies to every property listed on Stayora.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="h-5 w-5 text-successGreen" />
                <h2 className="font-semibold">Free cancellation</h2>
              </div>
              <p className="text-sm text-secondaryText">
                Cancel more than 48 hours before check-in and the booking is cancelled at no
                charge. Any amount paid is refunded in full. Rooms return to inventory immediately
                and become bookable by other guests.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <XCircle className="h-5 w-5 text-errorRed" />
                <h2 className="font-semibold">Inside 48 hours</h2>
              </div>
              <p className="text-sm text-secondaryText">
                After the cancellation deadline the booking can no longer be cancelled online.
                Contact support to discuss exceptional circumstances — each request is reviewed
                individually and there is no automatic entitlement to a refund.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4 text-sm text-secondaryText leading-relaxed">
            <h2 className="text-lg font-semibold text-deepOceanBlue">How refunds are handled</h2>
            <p>
              When a cancellation is accepted, the booking moves to <strong>Cancelled</strong> and its
              refund status moves to <strong>Pending</strong> where money was collected. Refunds are
              processed to the original payment method, typically within 5–7 business days.
            </p>
            <p>
              This demonstration deployment does not collect payments, so no money is transferred.
              Every booking records an amount paid of zero, and the refund status is tracked for
              completeness.
            </p>

            <h2 className="text-lg font-semibold text-deepOceanBlue pt-2">No-shows</h2>
            <p>
              A guest who does not arrive and does not cancel is recorded as a no-show at the
              property&apos;s discretion. No-shows are not eligible for refund.
            </p>

            <h2 className="text-lg font-semibold text-deepOceanBlue pt-2">Property cancellations</h2>
            <p>
              If a property cannot honour a confirmed reservation, Stayora will relocate the guest
              to a comparable property or refund the full amount.
            </p>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
