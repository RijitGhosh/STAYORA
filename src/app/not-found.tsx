import Link from "next/link"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-warmWhite">
      <Header />
      <div className="container mx-auto px-4 py-24 text-center max-w-md">
        <p className="text-6xl font-bold text-stayoraTeal mb-3">404</p>
        <h1 className="text-2xl font-bold mb-2">This page checked out</h1>
        <p className="text-secondaryText mb-6">
          The page you were looking for doesn&apos;t exist, or the property is no longer listed.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/"><Button variant="outline">Go home</Button></Link>
          <Link href="/search"><Button className="bg-stayoraTeal hover:bg-stayoraTeal/90">Find hotels</Button></Link>
        </div>
      </div>
      <Footer />
    </div>
  )
}
