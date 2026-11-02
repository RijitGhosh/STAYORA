import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import ContactForm from "@/app/contact/ContactForm"

export const metadata = { title: "Contact Stayora" }

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <h1 className="text-3xl font-bold mb-2">Contact us</h1>
        <p className="text-secondaryText mb-8">
          Questions about a booking, a refund, or listing your property? We answer every message.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="p-5 space-y-4 text-sm">
                <div className="flex gap-3">
                  <Mail className="h-4 w-4 text-stayoraTeal mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-secondaryText">support@stayora.example</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Phone className="h-4 w-4 text-stayoraTeal mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-secondaryText">+91 80 4000 0000</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="h-4 w-4 text-stayoraTeal mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Office</p>
                    <p className="text-secondaryText">Bengaluru, Karnataka, India</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="h-4 w-4 text-stayoraTeal mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium">Support hours</p>
                    <p className="text-secondaryText">Mon–Sun, 8am – 10pm IST</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-secondaryText px-1">
              These contact details are placeholders for a demonstration deployment and are not
              monitored. Ticket submissions are stored in the platform database for admin review.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
