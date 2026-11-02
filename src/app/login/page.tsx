"use client"

import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Suspense, useState } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setError("Invalid email or password")
        setLoading(false)
        return
      }

      // An explicit callback (e.g. a protected page) always wins; otherwise
      // send the account to the workspace its role actually uses.
      const callback = searchParams.get("callbackUrl")
      let destination = callback

      if (!destination) {
        const fresh = await getSession()
        const role = (fresh?.user as any)?.role as string | undefined
        destination =
          role === "ADMIN" ? "/admin"
          : role === "HOTEL_OWNER" ? "/owner"
          : ["RECEPTIONIST", "HOUSEKEEPING", "FINANCE"].includes(role ?? "") ? "/operations"
          : "/account"
      }

      router.push(destination)
      router.refresh()
    } catch {
      setError("Unable to sign in. Please try again.")
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Sign In to Stayora</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
            />
          </div>
          {error && <p className="text-sm text-errorRed">{error}</p>}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-stayoraTeal hover:bg-stayoraTeal/90"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/forgot-password" className="text-stayoraTeal hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="mt-3 text-center text-sm text-secondaryText">
          No account?{" "}
          <Link href="/register" className="text-stayoraTeal hover:underline font-medium">
            Register here
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <Suspense fallback={<p className="text-center text-secondaryText">Loading…</p>}>
          <LoginForm />
        </Suspense>
      </div>
      <Footer />
    </div>
  )
}
