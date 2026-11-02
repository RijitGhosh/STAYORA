import { NextResponse } from "next/server"
import { getCurrentUser } from "@/auth"
import { AuthzError, SessionUser } from "@/lib/permissions"

export async function apiUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return { id: user.id, name: user.name, email: user.email, role: user.role }
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export function ok(data: unknown = { success: true }, status = 200) {
  return NextResponse.json(data, { status })
}

/** Wrap a handler so AuthzError and unexpected errors map to clean responses. */
export async function handle(fn: () => Promise<NextResponse>) {
  try {
    return await fn()
  } catch (e) {
    if (e instanceof AuthzError) return fail(e.message, e.status)
    console.error("API error:", e)
    return fail("Something went wrong", 500)
  }
}

export async function body<T = any>(req: Request): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}
