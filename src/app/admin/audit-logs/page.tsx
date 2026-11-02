import { Card, CardContent } from "@/components/ui/card"
import { pageAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function AuditLogsPage() {
  await pageAdmin()
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Audit log</h2>
        <p className="text-sm text-secondaryText">
          Every privileged action writes a record here: approvals, role changes, rate edits,
          check-ins, checkouts and charge adjustments.
        </p>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {logs.length === 0 ? (
            <p className="p-6 text-sm text-secondaryText">No activity recorded yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-deepOceanBlue text-white">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium">When</th>
                  <th className="text-left px-4 py-2.5 font-medium">Actor</th>
                  <th className="text-left px-4 py-2.5 font-medium">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium">Entity</th>
                  <th className="text-left px-4 py-2.5 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 text-xs text-secondaryText whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2">{l.user?.name ?? "system"}</td>
                    <td className="px-4 py-2 font-mono text-xs">{l.action}</td>
                    <td className="px-4 py-2 text-xs text-secondaryText">{l.entity}</td>
                    <td className="px-4 py-2 text-xs text-secondaryText max-w-md truncate" title={l.details}>
                      {l.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
