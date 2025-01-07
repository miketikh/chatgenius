"use server"

import { db } from "@/db/db"
import {
    SelectDirectMessage,
    SelectMessage,
    channelMembersTable,
    directChatsTable,
    directMessagesTable,
    messagesTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, ilike, or } from "drizzle-orm"

interface SearchResult {
  channelMessages: SelectMessage[]
  directMessages: SelectDirectMessage[]
}

export async function searchMessagesAction(
  query: string,
  userId: string
): Promise<ActionState<SearchResult>> {
  try {
    // Search in channel messages
    const channelMessages = await db.query.messages.findMany({
      where: and(
        ilike(messagesTable.content, `%${query}%`),
        eq(channelMembersTable.userId, userId)
      )
    })

    // Search in direct messages
    const directMessages = await db.query.directMessages.findMany({
      where: and(
        ilike(directMessagesTable.content, `%${query}%`),
        or(
          eq(directChatsTable.user1Id, userId),
          eq(directChatsTable.user2Id, userId)
        )
      )
    })

    return {
      isSuccess: true,
      message: "Search completed successfully",
      data: {
        channelMessages,
        directMessages
      }
    }
  } catch (error) {
    console.error("Error searching messages:", error)
    return { isSuccess: false, message: "Failed to search messages" }
  }
} 