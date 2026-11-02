import { Card, CardContent } from "@/components/ui/card"
import { pageStaff } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import PropertyForm from "@/components/dashboard/PropertyForm"

export const dynamic = "force-dynamic"

export default async function NewPropertyPage() {
  await pageStaff("/owner/properties/new")
  const cities = await prisma.city.findMany({
    include: { state: true },
    orderBy: [{ state: { name: "asc" } }, { name: "asc" }],
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Add a property</h2>
        <p className="text-sm text-secondaryText">
          New properties are submitted for approval and become bookable once an administrator
          approves them.
        </p>
      </div>
      <Card>
        <CardContent className="p-6">
          <PropertyForm
            cities={cities.map((c) => ({ id: c.id, label: `${c.name}, ${c.state.name}` }))}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  )
}
