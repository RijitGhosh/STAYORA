import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const city = await prisma.city.findFirst({
    where: { name: { contains: slug.replace(/-/g, " ") } },
  })
  redirect(city ? `/search?destination=${encodeURIComponent(city.name)}` : "/search")
}
