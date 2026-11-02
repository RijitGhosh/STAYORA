import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  // Always answer 200 so the endpoint cannot be used to enumerate accounts.
  if (!parsed.success) return NextResponse.json({ ok: true })

  const email = parsed.data.email.toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })

  if (user) {
    const token = randomBytes(32).toString("hex")
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.passwordResetToken.create({ data: { token, userId: user.id, expires } })

    const url = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reset-password?token=${token}`
    console.log(`\n[Stayora] Password reset for ${email}:\n  ${url}\n`)
  }

  return NextResponse.json({ ok: true })
}
