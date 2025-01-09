"use server"

import { db } from "@/db/db"
import {
  SelectDirectMessage,
  SelectMessage,
  channelMembersTable,
  channelsTable,
  directChatsTable,
  directMessagesTable,
  messagesTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, ilike, inArray, or } from "drizzle-orm"

interface SearchResult {
  channelMessages: SelectMessage[]
  directMessages: SelectDirectMessage[]
}

interface SearchOptions {
  workspaceId?: string
  channelId?: string
}

export async function searchMessagesAction(
  query: string,
  userId: string,
  options: SearchOptions = {}
): Promise<ActionState<SearchResult>> {
  try {
    if (!query?.trim()) {
      return {
        isSuccess: true,
        message: "Empty query",
        data: { channelMessages: [], directMessages: [] }
      }
    }

    // Search in channel messages by joining with channel_members and channels
    const channelMessages = await db
      .select()
      .from(messagesTable)
      .innerJoin(
        channelMembersTable,
        and(
          eq(channelMembersTable.channelId, messagesTable.channelId),
          eq(channelMembersTable.userId, userId)
        )
      )
      .innerJoin(
        channelsTable,
        and(
          eq(channelsTable.id, messagesTable.channelId),
          // Only filter by workspace if provided
          options.workspaceId ? eq(channelsTable.workspaceId, options.workspaceId) : undefined
        )
      )
      .where(
        and(
          ilike(messagesTable.content, `%${query}%`),
          // Only filter by channel if provided
          options.channelId ? eq(messagesTable.channelId, options.channelId) : undefined
        )
      )

    // Get DM results only if we have a workspace ID
    let directMessages: any[] = []
    if (options.workspaceId) {
      // First get all chat IDs for this user in this workspace
      const userChats = await db
        .select({ id: directChatsTable.id })
        .from(directChatsTable)
        .where(
          and(
            eq(directChatsTable.workspaceId, options.workspaceId),
            or(
              eq(directChatsTable.user1Id, userId),
              eq(directChatsTable.user2Id, userId)
            )
          )
        )

      // Then search messages in those chats
      if (userChats.length > 0) {
        directMessages = await db
          .select()
          .from(directMessagesTable)
          .where(
            and(
              ilike(directMessagesTable.content, `%${query}%`),
              inArray(
                directMessagesTable.chatId,
                userChats.map(c => c.id)
              )
            )
          )
      }
    }

    return {
      isSuccess: true,
      message: "Search completed successfully",
      data: {
        channelMessages: channelMessages.map(row => ({
          ...row.messages
        })) as SelectMessage[],
        directMessages: directMessages as SelectDirectMessage[]
      }
    }
  } catch (error) {
    console.error("Error searching messages:", error)
    return { isSuccess: false, message: "Failed to search messages" }
  }
} 