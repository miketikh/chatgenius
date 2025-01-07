"use server"

import { db } from "@/db/db"
import { usersTable } from "@/db/schema"
import { ActionState } from "@/types"
import { createClient } from "@supabase/supabase-js"
import { eq } from "drizzle-orm"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function updatePresenceAction(
  userId: string,
  status: "online" | "offline" | "away"
): Promise<ActionState<void>> {
  try {
    // Update user status in database
    await db
      .update(usersTable)
      .set({
        status,
        lastSeen: new Date()
      })
      .where(eq(usersTable.id, userId))

    // Broadcast presence update
    await supabase.from("presence").upsert({
      user_id: userId,
      status,
      last_seen: new Date().toISOString()
    })

    return {
      isSuccess: true,
      message: "Presence updated successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error updating presence:", error)
    return { isSuccess: false, message: "Failed to update presence" }
  }
}

export async function subscribeToPresenceUpdates(userId: string) {
  return supabase
    .channel("presence")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "presence"
      },
      (payload) => {
        // Handle presence update
        console.log("Presence update:", payload)
      }
    )
    .subscribe()
} 