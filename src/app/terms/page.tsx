import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export const metadata = { title: "Terms & Conditions — Stayora" }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl prose-sm">
        <h1 className="text-3xl font-bold mb-2">Terms &amp; conditions</h1>
        <p className="text-sm text-secondaryText mb-8">
          Last updated 22 October 2026. This is a demonstration deployment; these terms are a
          template and must be reviewed by a qualified adviser before commercial launch.
        </p>

        <div className="space-y-6 text-sm text-secondaryText leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">1. The service</h2>
            <p>Stayora operates a platform that lets travellers search and reserve accommodation at participating properties in India, and lets property owners manage inventory and reservations. Stayora is not the operator of any property; the accommodation contract is between the guest and the property.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">2. Bookings</h2>
            <p>A reservation is confirmed when a booking reference is issued. Rates, taxes and availability are calculated on our servers at the moment of confirmation. Where a rate or availability error is discovered before check-in, we will contact you to rebook or refund in full.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">3. Payment</h2>
            <p>All amounts are in Indian Rupees and include applicable GST. In this demonstration deployment no payment is collected and no card or bank details are accepted.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">4. Cancellation</h2>
            <p>Cancellation terms are shown at checkout and recorded with each booking. The standard window is free cancellation up to 48 hours before check-in. See the <a className="text-stayoraTeal hover:underline" href="/cancellation-policy">cancellation policy</a>.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">5. Guest conduct</h2>
            <p>Guests must comply with property house rules, occupancy limits and valid identification requirements at check-in. Properties may refuse entry where identification or payment obligations are not met.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">6. Liability</h2>
            <p>To the extent permitted by law, Stayora&apos;s liability for any claim arising from a booking is limited to the total amount paid for that booking.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">7. Governing law</h2>
            <p>These terms are governed by the laws of India, with courts in Bengaluru having exclusive jurisdiction.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
