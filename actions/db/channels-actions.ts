"use server"

import { db } from "@/db/db"
import {
  channelMembersTable,
  channelsTable,
  InsertChannel,
  SelectChannel,
  SelectChannelMember
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, or } from "drizzle-orm"

export async function createChannelAction(
  channel: InsertChannel,
  members: string[]
): Promise<ActionState<SelectChannel>> {
  try {
    if (!channel.workspaceId) {
      return { isSuccess: false, message: "workspaceId is required" }
    }

    const [newChannel] = await db.insert(channelsTable).values(channel).returning()

    const memberInserts = members.map(userId => ({
      channelId: newChannel.id,
      userId
    }))
    await db.insert(channelMembersTable).values(memberInserts)

    return {
      isSuccess: true,
      message: "Channel created successfully",
      data: newChannel
    }
  } catch (error) {
    console.error("Error creating channel:", error)
    return { isSuccess: false, message: "Failed to create channel" }
  }
}

export async function getChannelAction(
  id: string
): Promise<ActionState<SelectChannel>> {
  try {
    const channel = await db.query.channels.findFirst({
      where: eq(channelsTable.id, id)
    })
    if (!channel) {
      return { isSuccess: false, message: "Channel not found" }
    }
    return {
      isSuccess: true,
      message: "Channel retrieved successfully",
      data: channel
    }
  } catch (error) {
    console.error("Error getting channel:", error)
    return { isSuccess: false, message: "Failed to get channel" }
  }
}

/**
 * Now also requires workspaceId
 */
export async function getUserChannelsAction(
  userId: string,
  workspaceId: string
): Promise<ActionState<SelectChannel[]>> {
  try {
    // Only channels in the target workspace
    // Public or user is a member
    const rows = await db
      .select()
      .from(channelsTable)
      .leftJoin(
        channelMembersTable,
        and(
          eq(channelsTable.id, channelMembersTable.channelId),
          eq(channelMembersTable.userId, userId)
        )
      )
      .where(
        and(
          eq(channelsTable.workspaceId, workspaceId),
          or(
            eq(channelsTable.type, "public"),
            eq(channelMembersTable.userId, userId)
          )
        )
      )

    const data = rows.map(r => r.channels)
    return {
      isSuccess: true,
      message: "Channels retrieved successfully",
      data
    }
  } catch (error) {
    console.error("Error getting user channels:", error)
    return { isSuccess: false, message: "Failed to get user channels" }
  }
}

export async function addChannelMemberAction(
  channelId: string,
  userId: string
): Promise<ActionState<SelectChannelMember>> {
  try {
    const [member] = await db
      .insert(channelMembersTable)
      .values({ channelId, userId })
      .returning()
    return {
      isSuccess: true,
      message: "Member added successfully",
      data: member
    }
  } catch (error) {
    console.error("Error adding channel member:", error)
    return { isSuccess: false, message: "Failed to add channel member" }
  }
}

export async function removeChannelMemberAction(
  channelId: string,
  userId: string
): Promise<ActionState<void>> {
  try {
    await db
      .delete(channelMembersTable)
      .where(
        and(
          eq(channelMembersTable.channelId, channelId),
          eq(channelMembersTable.userId, userId)
        )
      )
    return {
      isSuccess: true,
      message: "Member removed successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error removing channel member:", error)
    return { isSuccess: false, message: "Failed to remove channel member" }
  }
}

export async function deleteChannelAction(id: string): Promise<ActionState<void>> {
  try {
    await db.delete(channelsTable).where(eq(channelsTable.id, id))
    return {
      isSuccess: true,
      message: "Channel deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting channel:", error)
    return { isSuccess: false, message: "Failed to delete channel" }
  }
} 