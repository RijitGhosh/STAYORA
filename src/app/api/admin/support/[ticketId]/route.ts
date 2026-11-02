import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireAdmin, audit } from "@/lib/permissions"

const schema = z.object({
  message: z.string().min(1).max(4000).optional(),
  status: z.enum(["OPEN", "RESOLVED", "CLOSED"]).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  return handle(async () => {
    const { ticketId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)
    requireAdmin(user)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Nothing to save")

    const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } })
    if (!ticket) return fail("Ticket not found", 404)

    if (parsed.data.message) {
      await prisma.supportMessage.create({
        data: { ticketId, senderId: user.id, message: parsed.data.message, isStaff: true },
      })
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
    })

    await audit(user.id, "ticket.reply", "SupportTicket", ticketId, parsed.data)

    return ok({ id: updated.id, status: updated.status })
  })
}
