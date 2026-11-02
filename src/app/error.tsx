"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-warmWhite flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-coral mb-3">Oops</p>
        <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
        <p className="text-secondaryText mb-6">
          We hit an unexpected error loading this page. Try again, or head back to search.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={reset}>Try again</Button>
          <Link href="/search"><Button className="bg-stayoraTeal hover:bg-stayoraTeal/90">Find hotels</Button></Link>
        </div>
      </div>
    </div>
  )
}
