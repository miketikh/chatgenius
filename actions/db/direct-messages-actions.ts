"use server"

import { db } from "@/db/db"
import {
  DirectMessageReactions,
  InsertDirectMessage,
  SelectDirectChat,
  SelectDirectMessage,
  directChatsTable,
  directMessagesTable,
  usersTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, asc, eq, isNull, or, sql } from "drizzle-orm"

/**
 * Create a direct chat within a specific workspace.
 */
export async function createDirectChatAction(
  user1Id: string,
  user2Id: string,
  workspaceId: string
): Promise<ActionState<SelectDirectChat>> {
  try {
    // Check if chat already exists in THIS workspace
    const existingChat = await db.query.directChats.findFirst({
      where: and(
        eq(directChatsTable.workspaceId, workspaceId),
        or(
          and(eq(directChatsTable.user1Id, user1Id), eq(directChatsTable.user2Id, user2Id)),
          and(eq(directChatsTable.user1Id, user2Id), eq(directChatsTable.user2Id, user1Id))
        )
      )
    })

    if (existingChat) {
      return {
        isSuccess: true,
        message: "Direct chat already exists for these users in this workspace",
        data: existingChat
      }
    }

    const [newChat] = await db
      .insert(directChatsTable)
      .values({ user1Id, user2Id, workspaceId })
      .returning()

    return {
      isSuccess: true,
      message: "Direct chat created successfully",
      data: newChat
    }
  } catch (error) {
    console.error("Error creating direct chat:", error)
    return { isSuccess: false, message: "Failed to create direct chat" }
  }
}

/**
 * Filter direct chats by user + workspace
 */
export async function getUserDirectChatsAction(
  userId: string,
  workspaceId: string
): Promise<ActionState<SelectDirectChat[]>> {
  try {
    const chats = await db.query.directChats.findMany({
      where: and(
        eq(directChatsTable.workspaceId, workspaceId),
        or(eq(directChatsTable.user1Id, userId), eq(directChatsTable.user2Id, userId))
      )
    })
    return {
      isSuccess: true,
      message: "Direct chats retrieved successfully",
      data: chats
    }
  } catch (error) {
    console.error("Error getting user direct chats:", error)
    return { isSuccess: false, message: "Failed to get user direct chats" }
  }
}

export async function createDirectMessageAction(
  message: InsertDirectMessage
): Promise<ActionState<SelectDirectMessage>> {
  try {
    const [newMessage] = await db
      .insert(directMessagesTable)
      .values(message)
      .returning()

    return {
      isSuccess: true,
      message: "Direct message created successfully",
      data: newMessage
    }
  } catch (error) {
    console.error("Error creating direct message:", error)
    return { isSuccess: false, message: "Failed to create direct message" }
  }
}

export async function getDirectChatMessagesAction(
  chatId: string,
  limit = 50
): Promise<ActionState<(SelectDirectMessage & { senderUsername: string })[]>> {
  try {
    const messages = await db
      .select({
        ...directMessagesTable,
        senderUsername: usersTable.username
      })
      .from(directMessagesTable)
      .innerJoin(usersTable, eq(directMessagesTable.senderId, usersTable.id))
      .where(
        and(
          eq(directMessagesTable.chatId, chatId),
          isNull(directMessagesTable.parentId)
        )
      )
      .orderBy(asc(directMessagesTable.createdAt))
      .limit(limit)

    return {
      isSuccess: true,
      message: "Direct messages retrieved successfully",
      data: messages
    }
  } catch (error) {
    console.error("Error getting direct chat messages:", error)
    return { isSuccess: false, message: "Failed to get direct chat messages" }
  }
}

export async function getDirectThreadMessagesAction(
  parentId: string
): Promise<ActionState<(SelectDirectMessage & { senderUsername: string })[]>> {
  try {
    const messages = await db
      .select({
        ...directMessagesTable,
        senderUsername: usersTable.username
      })
      .from(directMessagesTable)
      .innerJoin(usersTable, eq(directMessagesTable.senderId, usersTable.id))
      .where(eq(directMessagesTable.parentId, parentId))
      .orderBy(directMessagesTable.createdAt)

    return {
      isSuccess: true,
      message: "Thread messages retrieved successfully",
      data: messages
    }
  } catch (error) {
    console.error("Error getting thread messages:", error)
    return { isSuccess: false, message: "Failed to get thread messages" }
  }
}

export async function addDirectMessageReactionAction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<ActionState<SelectDirectMessage>> {
  try {
    const message = await db.query.directMessages.findFirst({
      where: eq(directMessagesTable.id, messageId)
    })
    if (!message) {
      return { isSuccess: false, message: "Direct message not found" }
    }

    const reactions = message.reactions as DirectMessageReactions
    if (!reactions[emoji]) {
      reactions[emoji] = []
    }
    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId)
    }

    const [updatedMessage] = await db
      .update(directMessagesTable)
      .set({ reactions })
      .where(eq(directMessagesTable.id, messageId))
      .returning()

    return {
      isSuccess: true,
      message: "Reaction added successfully",
      data: updatedMessage
    }
  } catch (error) {
    console.error("Error adding reaction:", error)
    return { isSuccess: false, message: "Failed to add reaction" }
  }
}

export async function removeDirectMessageReactionAction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<ActionState<SelectDirectMessage>> {
  try {
    const message = await db.query.directMessages.findFirst({
      where: eq(directMessagesTable.id, messageId)
    })
    if (!message) {
      return { isSuccess: false, message: "Direct message not found" }
    }

    const reactions = message.reactions as DirectMessageReactions
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter(id => id !== userId)
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    }

    const [updatedMessage] = await db
      .update(directMessagesTable)
      .set({ reactions })
      .where(eq(directMessagesTable.id, messageId))
      .returning()

    return {
      isSuccess: true,
      message: "Reaction removed successfully",
      data: updatedMessage
    }
  } catch (error) {
    console.error("Error removing reaction:", error)
    return { isSuccess: false, message: "Failed to remove reaction" }
  }
}

export async function deleteDirectMessageAction(
  id: string
): Promise<ActionState<void>> {
  try {
    await db.delete(directMessagesTable).where(eq(directMessagesTable.id, id))
    return {
      isSuccess: true,
      message: "Direct message deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting direct message:", error)
    return { isSuccess: false, message: "Failed to delete direct message" }
  }
}

export async function createDirectThreadMessageAction(
  message: InsertDirectMessage
): Promise<ActionState<SelectDirectMessage>> {
  try {
    // Transaction to insert new message + bump reply count on parent
    const result = await db.transaction(async tx => {
      const [newMessage] = await tx
        .insert(directMessagesTable)
        .values(message)
        .returning()

      if (message.parentId) {
        await tx
          .update(directMessagesTable)
          .set({ replyCount: sql`${directMessagesTable.replyCount} + 1` })
          .where(eq(directMessagesTable.id, message.parentId))
      }

      return newMessage
    })

    return {
      isSuccess: true,
      message: "Thread message created successfully",
      data: result
    }
  } catch (error) {
    console.error("Error creating thread message:", error)
    return { isSuccess: false, message: "Failed to create thread message" }
  }
} 