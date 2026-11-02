"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle } from "lucide-react"

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sent, setSent] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  function update(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError("")

    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)

    if (!res.ok) {
      setError(data.error ?? "Couldn't send your message")
      return
    }
    setSent(data.ticketNumber ?? "received")
  }

  if (sent) {
    return (
      <div className="text-center py-10">
        <CheckCircle className="h-12 w-12 text-successGreen mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">Message received</h2>
        <p className="text-sm text-secondaryText">
          Your support ticket is <span className="font-medium text-stayoraTeal">{sent}</span>.
          Our team reviews tickets in the admin console.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Your name</label>
          <Input value={form.name} onChange={update("name")} required />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Email</label>
          <Input type="email" value={form.email} onChange={update("email")} required />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Subject</label>
        <Input value={form.subject} onChange={update("subject")} placeholder="Booking, refund, listing a property…" required />
      </div>
      <div>
        <label className="text-sm font-medium mb-2 block">Message</label>
        <textarea
          value={form.message}
          onChange={update("message")}
          required
          rows={6}
          className="w-full rounded-md border border-border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stayoraTeal"
        />
      </div>
      {error && <p className="text-sm text-errorRed">{error}</p>}
      <Button type="submit" disabled={busy} className="bg-stayoraTeal hover:bg-stayoraTeal/90">
        {busy ? "Sending…" : "Send message"}
      </Button>
    </form>
  )
}
