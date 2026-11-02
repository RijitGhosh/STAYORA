import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { ShieldAlert } from "lucide-react"

export const metadata = { title: "Access denied — Stayora" }

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <ShieldAlert className="h-12 w-12 text-errorRed mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access denied</h1>
        <p className="text-secondaryText mb-6">
          Your account doesn&apos;t have permission to view this area. If you think that&apos;s wrong,
          contact support and we&apos;ll check your role.
        </p>
        <Link href="/account"><Button className="bg-stayoraTeal hover:bg-stayoraTeal/90">Go to my account</Button></Link>
      </div>
      <Footer />
    </div>
  )
}
