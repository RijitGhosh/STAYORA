import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { apiUser, fail, ok, handle, body } from "@/lib/api-helpers"
import { requireHousekeeping, audit } from "@/lib/permissions"

const schema = z.object({
  status: z.enum(["AVAILABLE", "OCCUPIED", "MAINTENANCE", "OUT_OF_SERVICE"]).optional(),
  housekeepingStatus: z
    .enum(["CLEANING_REQUIRED", "CLEANING_IN_PROGRESS", "INSPECTED", "READY_FOR_ASSIGNMENT", "DIRTY", "CLEAN"])
    .optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  return handle(async () => {
    const { roomId } = await params
    const user = await apiUser()
    if (!user) return fail("Please sign in", 401)

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) return fail("Room not found", 404)

    await requireHousekeeping(user, room.hotelId)

    const parsed = schema.safeParse(await body(req))
    if (!parsed.success) return fail("Invalid room status")

    // An occupied room can't be yanked out of service without a checkout first.
    if (parsed.data.status && room.status === "OCCUPIED" && parsed.data.status !== "OCCUPIED") {
      return fail("Check the guest out before changing this room's status")
    }
    if (parsed.data.status === "OCCUPIED") {
      return fail("Rooms are marked occupied by checking a guest in")
    }

    const updated = await prisma.room.update({
      where: { id: roomId },
      data: parsed.data,
    })

    await audit(user.id, "room.update", "Room", roomId, parsed.data)

    return ok({ id: updated.id, status: updated.status })
  })
}
