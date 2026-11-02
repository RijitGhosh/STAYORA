import NextAuth from "next-auth"
import authConfig from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.email) return null
  const { prisma } = await import("@/lib/prisma")
  return prisma.user.findUnique({ where: { email: session.user.email } })
}
