import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const protectedPrefixes = ["/account", "/checkout", "/owner", "/operations", "/admin"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const needsAuth = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
  if (!needsAuth) return NextResponse.next()

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*", "/owner/:path*", "/operations/:path*", "/admin/:path*"],
}
