import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"

export const metadata = { title: "Help Centre — Stayora" }

const FAQ = [
  { q: "How do I cancel a booking?", a: "Open Account → Bookings, choose the reservation and use Cancel. Free cancellation applies up to 48 hours before check-in; your rooms are released immediately and any amount paid moves to refund pending." },
  { q: "When will I receive my refund?", a: "Refunds are processed to the original payment method. The booking page shows the live refund status. In this demonstration build no money is collected, so refunds are recorded but not transferred." },
  { q: "Are prices inclusive of taxes?", a: "Yes. Every rate shown at checkout includes GST — 12% for rooms up to ₹7,500 a night and 18% above that. The breakdown is itemised before you confirm." },
  { q: "Can I book for someone else?", a: "Yes. Enter the guest's name, email and phone at checkout. The booking appears in your account and the invoice is issued to the named guest." },
  { q: "How do I get my invoice?", a: "Every confirmed booking has a Download invoice button on the confirmation screen and in Account → Bookings. The invoice opens as a printable page you can save as PDF." },
  { q: "How do I list my hotel?", a: "Create an account and register as a property owner. Submitted properties enter an approval queue and become bookable once an administrator approves them." },
]

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Help centre</h1>
        <p className="text-secondaryText mb-8">Answers to the questions we get most often.</p>

        <div className="space-y-3">
          {FAQ.map((f) => (
            <Card key={f.q}>
              <CardContent className="p-5">
                <h2 className="font-semibold mb-2">{f.q}</h2>
                <p className="text-sm text-secondaryText leading-relaxed">{f.a}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-sm text-secondaryText">
          Still stuck? <a className="text-stayoraTeal hover:underline" href="/contact">Contact support</a> and we&apos;ll open a ticket.
        </div>
      </div>
      <Footer />
    </div>
  )
}
