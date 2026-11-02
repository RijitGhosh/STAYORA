import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentUser } from "@/auth"
import { validateCoupon } from "@/lib/booking-service"

const schema = z.object({
  code: z.string().min(1),
  amount: z.number().positive(),
})

export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ valid: false, error: "Please sign in first" }, { status: 401 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ valid: false, error: "Enter a coupon code" }, { status: 400 })
  }

  const result = await validateCoupon(parsed.data.code, parsed.data.amount, user.id)
  if (!result) {
    return NextResponse.json(
      { valid: false, error: "That coupon code isn't valid for this booking" },
      { status: 400 }
    )
  }

  return NextResponse.json({ valid: true, discount: result.discount, code: result.code })
}
