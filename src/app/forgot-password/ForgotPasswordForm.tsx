"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
    setBusy(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-secondaryText">
          If an account exists for <strong>{email}</strong>, a reset link has been generated.
          In this build email delivery is not configured, so the link is written to the server
          console — check the terminal running <code>npm run dev</code>.
        </p>
        <Link href="/login" className="inline-block mt-4 text-sm text-stayoraTeal hover:underline">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-secondaryText">
        Enter the email address on your account and we&apos;ll send reset instructions.
      </p>
      <div>
        <label className="text-sm font-medium mb-2 block">Email</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-stayoraTeal hover:bg-stayoraTeal/90">
        {busy ? "Sending…" : "Send reset link"}
      </Button>
      <div className="text-center text-sm">
        <Link href="/login" className="text-stayoraTeal hover:underline">Back to sign in</Link>
      </div>
    </form>
  )
}
