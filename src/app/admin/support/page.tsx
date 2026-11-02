import { Card, CardContent } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import TicketList from "@/components/admin/TicketList"

export const dynamic = "force-dynamic"

export default async function AdminSupportPage() {
  await pageAdmin()
  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Support tickets</h2>
        <p className="text-sm text-secondaryText">
          Submitted through the public contact form. Replies are stored against the ticket.
        </p>
      </div>

      {tickets.length === 0 ? (
        <Card><CardContent className="p-10 text-center text-sm text-secondaryText">
          No tickets yet.
        </CardContent></Card>
      ) : (
        <TicketList
          tickets={tickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            subject: t.subject,
            status: t.status,
            priority: t.priority,
            from: t.user.name,
            email: t.user.email,
            createdAt: t.createdAt.toISOString(),
            messages: t.messages.map((m) => ({
              id: m.id,
              body: m.message,
              isStaff: m.isStaff,
              createdAt: m.createdAt.toISOString(),
            })),
          }))}
        />
      )}
    </div>
  )
}
