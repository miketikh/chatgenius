"use server"

import { db } from "@/db/db"
import {
  SelectDirectMessage,
  SelectMessage,
  channelMembersTable,
  channelsTable,
  directChatsTable,
  directMessagesTable,
  messagesTable,
  usersTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, ilike, inArray, or } from "drizzle-orm"

interface SearchResult {
  channelMessages: (SelectMessage & { username: string; channelName: string })[]
  directMessages: (SelectDirectMessage & { senderUsername: string })[]
}

interface SearchOptions {
  workspaceId?: string
  channelId?: string
  chatId?: string
  type?: "channel" | "direct"
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

    let channelMessages: (SelectMessage & { username: string; channelName: string })[] = []
    let directMessages: (SelectDirectMessage & { senderUsername: string })[] = []

    // Search in channel messages if type is not "direct"
    if (options.type !== "direct") {
      const channelResults = await db
        .select({
          id: messagesTable.id,
          createdAt: messagesTable.createdAt,
          updatedAt: messagesTable.updatedAt,
          channelId: messagesTable.channelId,
          userId: messagesTable.userId,
          content: messagesTable.content,
          fileName: messagesTable.fileName,
          fileUrl: messagesTable.fileUrl,
          reactions: messagesTable.reactions,
          parentId: messagesTable.parentId,
          replyCount: messagesTable.replyCount,
          username: usersTable.username,
          channelName: channelsTable.name
        })
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
            options.workspaceId ? eq(channelsTable.workspaceId, options.workspaceId) : undefined
          )
        )
        .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
        .where(
          and(
            ilike(messagesTable.content, `%${query}%`),
            options.channelId ? eq(messagesTable.channelId, options.channelId) : undefined
          )
        )

      channelMessages = channelResults
    }

    // Search in direct messages if type is not "channel"
    if (options.type !== "channel" && options.workspaceId) {
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
            ),
            options.chatId ? eq(directChatsTable.id, options.chatId) : undefined
          )
        )

      // Then search messages in those chats
      if (userChats.length > 0) {
        const dmResults = await db
          .select({
            id: directMessagesTable.id,
            createdAt: directMessagesTable.createdAt,
            updatedAt: directMessagesTable.updatedAt,
            chatId: directMessagesTable.chatId,
            senderId: directMessagesTable.senderId,
            content: directMessagesTable.content,
            fileName: directMessagesTable.fileName,
            fileUrl: directMessagesTable.fileUrl,
            reactions: directMessagesTable.reactions,
            parentId: directMessagesTable.parentId,
            replyCount: directMessagesTable.replyCount,
            senderUsername: usersTable.username
          })
          .from(directMessagesTable)
          .innerJoin(usersTable, eq(directMessagesTable.senderId, usersTable.id))
          .where(
            and(
              ilike(directMessagesTable.content, `%${query}%`),
              inArray(
                directMessagesTable.chatId,
                userChats.map(c => c.id)
              )
            )
          )

        directMessages = dmResults
      }
    }

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