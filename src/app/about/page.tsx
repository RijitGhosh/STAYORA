import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Building2, ShieldCheck, MapPin, Users } from "lucide-react"

export const metadata = { title: "About Stayora" }

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />

      <section className="bg-deepOceanBlue text-white py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h1 className="text-4xl font-bold text-white mb-4">Every Stay, A Better Story</h1>
          <p className="text-lg text-gray-200">
            Stayora is a hotel booking and property management platform built for India — from
            beach resorts in Goa to heritage havelis in Rajasthan and business hotels in Bengaluru.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          {[
            { icon: Building2, value: "83", label: "Partner properties" },
            { icon: MapPin, value: "32", label: "Cities across India" },
            { icon: Users, value: "16", label: "States covered" },
            { icon: ShieldCheck, value: "48h", label: "Free cancellation window" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5 text-center">
                <s.icon className="h-6 w-6 text-stayoraTeal mx-auto mb-2" />
                <p className="text-2xl font-bold text-deepOceanBlue">{s.value}</p>
                <p className="text-xs text-secondaryText">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-6">
          <CardContent className="p-8 space-y-4 text-secondaryText leading-relaxed">
            <h2 className="text-xl font-semibold text-deepOceanBlue">What we do</h2>
            <p>
              Stayora connects travellers with verified properties across India, and gives hotel
              owners and their teams a single system for inventory, rates, reservations, check-in,
              housekeeping and billing. Guests search live availability, book at transparent
              prices in Indian Rupees, and manage their stay from a personal dashboard.
            </p>
            <p>
              Every rate shown includes applicable GST, broken out line by line before payment.
              Free cancellation applies up to 48 hours before check-in on all listed properties.
            </p>

            <h2 className="text-xl font-semibold text-deepOceanBlue pt-2">How pricing works</h2>
            <p>
              Room rates are set per property and per room type, with weekend pricing applied
              automatically. GST is charged at 12% for rooms up to ₹7,500 a night and 18% above
              that. Coupons and discounts are validated on our servers before a booking is
              confirmed — never trusted from the browser.
            </p>

            <h2 className="text-xl font-semibold text-deepOceanBlue pt-2">Inventory you can trust</h2>
            <p>
              Availability is enforced at the database level. When two guests try to book the last
              room at the same moment, one booking succeeds and the other receives a clear message
              to choose different dates. Cancelled bookings release their rooms back to stock
              immediately.
            </p>

            <h2 className="text-xl font-semibold text-deepOceanBlue pt-2">About this build</h2>
            <p>
              This is a demonstration deployment. All properties, reviews and photographs shown are
              sample data — the properties are fictional and the photography is generic stock
              imagery, not photographs of any real hotel. Payments are not collected; bookings are
              recorded and invoices generated, but no money moves. Razorpay sandbox keys can be
              added to enable the full payment flow.
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  )
}
