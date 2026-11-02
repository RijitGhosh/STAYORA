import { Card, CardContent } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/utils"
import UserRoleSelect from "@/components/admin/UserRoleSelect"

export const dynamic = "force-dynamic"

export default async function AdminUsersPage() {
  await pageAdmin()
  const users = await prisma.user.findMany({
    include: { _count: { select: { bookings: true, ownedHotels: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Users</h2>
        <p className="text-sm text-secondaryText">
          Roles control what each account can reach. Platform administrators are the only accounts
          that can change roles.
        </p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-deepOceanBlue text-white">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Name</th>
                <th className="text-left px-4 py-2.5 font-medium">Email</th>
                <th className="text-left px-4 py-2.5 font-medium">Role</th>
                <th className="text-right px-4 py-2.5 font-medium">Bookings</th>
                <th className="text-right px-4 py-2.5 font-medium">Properties</th>
                <th className="text-left px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5 font-medium">{u.name}</td>
                  <td className="px-4 py-2.5 text-secondaryText">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <UserRoleSelect userId={u.id} role={u.role} />
                  </td>
                  <td className="px-4 py-2.5 text-right text-secondaryText">{u._count.bookings}</td>
                  <td className="px-4 py-2.5 text-right text-secondaryText">{u._count.ownedHotels}</td>
                  <td className="px-4 py-2.5 text-secondaryText">{formatDate(u.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
