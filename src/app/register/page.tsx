"use client"

import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  function update(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error || "Registration failed")
      setLoading(false)
      return
    }

    const login = await signIn("credentials", {
      email: form.email.toLowerCase().trim(),
      password: form.password,
      redirect: false,
    })

    if (login?.error) {
      router.push("/login")
      return
    }

    router.push("/account")
    router.refresh()
  }

  return (
    <div className="min-h-screen">
      <Header />
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Full Name</label>
                <Input value={form.name} onChange={update("name")} placeholder="Your full name" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input type="email" value={form.email} onChange={update("email")} placeholder="you@example.com" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Phone</label>
                <Input type="tel" value={form.phone} onChange={update("phone")} placeholder="10-digit mobile number" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <Input type="password" value={form.password} onChange={update("password")} placeholder="At least 8 characters" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Confirm Password</label>
                <Input type="password" value={form.confirmPassword} onChange={update("confirmPassword")} placeholder="Re-enter password" required />
              </div>
              {error && <p className="text-sm text-errorRed">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full bg-stayoraTeal hover:bg-stayoraTeal/90">
                {loading ? "Creating account..." : "Register"}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-secondaryText">
              Already have an account?{" "}
              <Link href="/login" className="text-stayoraTeal hover:underline font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  )
}
