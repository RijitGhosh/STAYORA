import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/auth"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(5),
})

function ticketNumber() {
  const y = new Date().getFullYear()
  return `TKT-${y}-${Math.floor(Math.random() * 900000) + 100000}`
}

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in every field" }, { status: 400 })
  }

  const { name, email, subject, message } = parsed.data
  const user = await getCurrentUser()

  // A signed-in user's ticket attaches to their account. Guests get a
  // lightweight account-less ticket tied to the address they wrote from.
  let userId = user?.id
  if (!userId) {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      userId = existing.id
    } else {
      const placeholder = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash: "!guest-ticket-no-login",
          role: "CUSTOMER",
          isActive: false,
        },
      })
      userId = placeholder.id
    }
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber: ticketNumber(),
      userId: userId!,
      subject,
      category: "GENERAL",
      priority: "MEDIUM",
      status: "OPEN",
      messages: {
        create: { senderId: userId!, message, isStaff: false },
      },
    },
  })

  return NextResponse.json({ success: true, ticketNumber: ticket.ticketNumber }, { status: 201 })
}
