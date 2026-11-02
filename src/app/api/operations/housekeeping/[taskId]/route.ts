import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireHousekeeping } from "@/lib/permissions"

const schema = z.object({
  assignedTo: z.string().nullable(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  return handle(async () => {
    const { taskId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const task = await prisma.housekeepingTask.findUnique({ where: { id: taskId } })
    if (!task) return fail("Task not found", 404)

    await requireHousekeeping(user, task.hotelId)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Invalid assignee")

    if (parsed.data.assignedTo) {
      const assignee = await prisma.user.findUnique({ where: { id: parsed.data.assignedTo } })
      if (!assignee) return fail("That user doesn't exist", 404)
    }

    const updated = await prisma.housekeepingTask.update({
      where: { id: taskId },
      data: { assignedTo: parsed.data.assignedTo },
    })

    return ok({ id: updated.id, assignedTo: updated.assignedTo })
  })
}
