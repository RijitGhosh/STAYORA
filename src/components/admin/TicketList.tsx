"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/utils"

type Ticket = {
  id: string
  ticketNumber: string
  subject: string
  status: string
  priority: string
  from: string
  email: string
  createdAt: string
  messages: { id: string; body: string; isStaff: boolean; createdAt: string }[]
}

export default function TicketList({ tickets }: { tickets: Ticket[] }) {
  const router = useRouter()
  const [open, setOpen] = useState<string | null>(tickets[0]?.id ?? null)
  const [reply, setReply] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function respond(id: string, status?: string) {
    if (!reply.trim() && !status) return
    setBusy(true); setError("")
    const res = await fetch(`/api/admin/support/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply || undefined, status }),
    })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setError(data.error ?? "Couldn't send"); return }
    setReply("")
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-errorRed">{error}</p>}
      {tickets.map((t) => (
        <Card key={t.id}>
          <CardContent className="p-4">
            <button
              onClick={() => setOpen(open === t.id ? null : t.id)}
              className="w-full text-left flex flex-wrap items-start justify-between gap-2"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{t.subject}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                    t.status === "OPEN" ? "bg-warningAmber/10 text-warningAmber" : "bg-successGreen/10 text-successGreen"
                  }`}>{t.status}</span>
                </div>
                <p className="text-xs text-secondaryText mt-0.5">
                  {t.ticketNumber} · {t.from} ({t.email}) · {formatDate(t.createdAt)}
                </p>
              </div>
              <span className="text-xs text-stayoraTeal">{open === t.id ? "Hide" : "Open"}</span>
            </button>

            {open === t.id && (
              <div className="mt-4 space-y-3 border-t border-border pt-3">
                {t.messages.map((m) => (
                  <div key={m.id} className={`text-sm rounded-lg p-3 ${m.isStaff ? "bg-stayoraTeal/5 border border-stayoraTeal/20 ml-6" : "bg-warmWhite"}`}>
                    <p className="text-[11px] text-secondaryText mb-1">
                      {m.isStaff ? "Staff" : t.from} · {new Date(m.createdAt).toLocaleString("en-IN")}
                    </p>
                    <p>{m.body}</p>
                  </div>
                ))}

                <div className="flex flex-wrap gap-2 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-medium mb-1 block">Reply</label>
                    <Input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type a response…" />
                  </div>
                  <Button size="sm" disabled={busy} onClick={() => respond(t.id)} className="bg-stayoraTeal hover:bg-stayoraTeal/90">
                    Send reply
                  </Button>
                  {t.status === "OPEN" && (
                    <Button size="sm" variant="outline" disabled={busy} onClick={() => respond(t.id, "RESOLVED")}>
                      Mark resolved
                    </Button>
                  )}
                </div>
                <p className="text-[11px] text-secondaryText">
                  Replies are stored on the ticket. Email delivery is not configured in this build.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
