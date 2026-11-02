import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export const metadata = { title: "Privacy Policy — Stayora" }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold mb-2">Privacy policy</h1>
        <p className="text-sm text-secondaryText mb-8">Last updated 22 October 2026. Template content for a demonstration deployment.</p>

        <div className="space-y-6 text-sm text-secondaryText leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">What we collect</h2>
            <p>Account details (name, email, mobile), booking details (stay dates, room type, guest names), and support correspondence. Passwords are stored only as a one-way bcrypt hash — never in plain text.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">How we use it</h2>
            <p>To create and manage your bookings, issue invoices, respond to support requests, and prevent fraud. We do not sell personal data.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">Who can see it</h2>
            <p>Hotel staff can see the guest details for reservations at their own property only. Platform administrators can see platform-wide records for support and compliance. Access is enforced on the server for every request.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">Retention</h2>
            <p>Booking and invoice records are retained for the period required by Indian tax and accounting rules. Account deletion removes profile data while preserving financial records in anonymised form.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-deepOceanBlue mb-2">Your rights</h2>
            <p>You may request access to, correction of, or deletion of your personal data by contacting support. We respond within 30 days.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  )
}
