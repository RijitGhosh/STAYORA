import Link from "next/link"
import { Building2 } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-deepOceanBlue text-white mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-stayoraTeal" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Stayora</h3>
                <p className="text-xs text-gray-300">Every Stay, A Better Story</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm">
              India's trusted hotel booking platform for every journey.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Company</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/about" className="hover:text-brightTeal">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-brightTeal">Contact</Link></li>
              <li><Link href="/help" className="hover:text-brightTeal">Help Center</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/terms" className="hover:text-brightTeal">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-brightTeal">Privacy Policy</Link></li>
              <li><Link href="/cancellation-policy" className="hover:text-brightTeal">Cancellation & Refund</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-white">For Partners</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><Link href="/owner/properties/new" className="hover:text-brightTeal">List Your Property</Link></li>
              <li><Link href="/owner" className="hover:text-brightTeal">Partner Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-300">
          <p>&copy; {new Date().getFullYear()} Stayora. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
