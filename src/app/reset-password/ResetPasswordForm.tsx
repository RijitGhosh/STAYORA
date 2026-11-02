"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"

export default function ResetPasswordForm() {
  const sp = useSearchParams()
  const router = useRouter()
  const token = sp.get("token") ?? ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password !== confirm) { setError("Passwords do not match"); return }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return }

    setBusy(true)
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)

    if (!res.ok) { setError(data.error ?? "Couldn't reset your password"); return }
    router.push("/login?reset=1")
  }

  if (!token) {
    return (
      <p className="text-sm text-secondaryText text-center">
        This link is missing its token.{" "}
        <Link href="/forgot-password" className="text-stayoraTeal hover:underline">Request a new one</Link>.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">New password</label>
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Confirm new password</label>
        <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-errorRed">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full bg-stayoraTeal hover:bg-stayoraTeal/90">
        {busy ? "Saving…" : "Set password"}
      </Button>
    </form>
  )
}
