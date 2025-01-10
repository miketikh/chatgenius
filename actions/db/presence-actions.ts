"use server"

import { db } from "@/db/db"
import { InsertPresence, SelectPresence, presenceTable } from "@/db/schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function upsertPresenceAction(
  userId: string,
  data: Partial<InsertPresence>
): Promise<ActionState<SelectPresence>> {
  try {
    // First try to get existing presence
    const existing = await db.query.presence.findFirst({
      where: eq(presenceTable.userId, userId)
    })

    // If no presence exists, create initial presence as online
    if (!existing) {
      const [presence] = await db
        .insert(presenceTable)
        .values({
          userId,
          status: "online",
          lastSeen: new Date(),
          ...data
        })
        .returning()

      return {
        isSuccess: true,
        message: "Initial presence created successfully",
        data: presence
      }
    }

    // Otherwise update existing presence
    const [presence] = await db
      .update(presenceTable)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(presenceTable.userId, userId))
      .returning()

    return {
      isSuccess: true,
      message: "Presence updated successfully",
      data: presence
    }
  } catch (error) {
    console.error("Error upserting presence:", error)
    return { isSuccess: false, message: "Failed to update presence" }
  }
}

export async function getPresenceAction(
  userId: string
): Promise<ActionState<SelectPresence | undefined>> {
  try {
    const presence = await db.query.presence.findFirst({
      where: eq(presenceTable.userId, userId)
    })

    return {
      isSuccess: true,
      message: "Presence retrieved successfully",
      data: presence
    }
  } catch (error) {
    console.error("Error getting presence:", error)
    return { isSuccess: false, message: "Failed to get presence" }
  }
}

export async function getPresencesAction(
  userIds: string[]
): Promise<ActionState<SelectPresence[]>> {
  try {
    const presences = await db.query.presence.findMany({
      where: (presence, { inArray }) => inArray(presence.userId, userIds)
    })

    return {
      isSuccess: true,
      message: "Presences retrieved successfully",
      data: presences
    }
  } catch (error) {
    console.error("Error getting presences:", error)
    return { isSuccess: false, message: "Failed to get presences" }
  }
} 