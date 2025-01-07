"use server"

import { db } from "@/db/db"
import {
    InsertMessage,
    MessageReactions,
    SelectMessage,
    messagesTable,
    usersTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, asc, eq, isNull, sql } from "drizzle-orm"

export async function createMessageAction(
  message: InsertMessage
): Promise<ActionState<SelectMessage & { username: string }>> {
  try {
    const [newMessage] = await db
      .insert(messagesTable)
      .values(message)
      .returning()

    // Get the username
    const user = await db.query.users.findFirst({
      where: eq(usersTable.id, message.userId),
      columns: { username: true }
    })

    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }

    return {
      isSuccess: true,
      message: "Message created successfully",
      data: { ...newMessage, username: user.username }
    }
  } catch (error) {
    console.error("Error creating message:", error)
    return { isSuccess: false, message: "Failed to create message" }
  }
}

export async function getChannelMessagesAction(
  channelId: string,
  limit = 50
): Promise<ActionState<(SelectMessage & { username: string })[]>> {
  try {
    const messages = await db
      .select({
        ...messagesTable,
        username: usersTable.username
      })
      .from(messagesTable)
      .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
      .where(
        and(
          eq(messagesTable.channelId, channelId),
          isNull(messagesTable.parentId)
        )
      )
      .orderBy(asc(messagesTable.createdAt))
      .limit(limit)

    return {
      isSuccess: true,
      message: "Messages retrieved successfully",
      data: messages
    }
  } catch (error) {
    console.error("Error getting channel messages:", error)
    return { isSuccess: false, message: "Failed to get channel messages" }
  }
}

export async function getThreadMessagesAction(
  parentId: string
): Promise<ActionState<(SelectMessage & { username: string })[]>> {
  try {
    const messages = await db
      .select({
        ...messagesTable,
        username: usersTable.username
      })
      .from(messagesTable)
      .innerJoin(usersTable, eq(messagesTable.userId, usersTable.id))
      .where(eq(messagesTable.parentId, parentId))
      .orderBy(messagesTable.createdAt)

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

export async function createThreadMessageAction(
  message: InsertMessage
): Promise<ActionState<SelectMessage & { username: string }>> {
  try {
    // Start a transaction
    const result = await db.transaction(async tx => {
      // Insert the new message
      const [newMessage] = await tx
        .insert(messagesTable)
        .values(message)
        .returning()

      // Increment the reply count on the parent message
      if (message.parentId) {
        await tx
          .update(messagesTable)
          .set({ replyCount: sql`${messagesTable.replyCount} + 1` })
          .where(eq(messagesTable.id, message.parentId))
      }

      // Get the username
      const user = await tx.query.users.findFirst({
        where: eq(usersTable.id, message.userId),
        columns: { username: true }
      })

      if (!user) {
        throw new Error("User not found")
      }

      return { ...newMessage, username: user.username }
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

export async function addReactionAction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<ActionState<SelectMessage>> {
  try {
    const message = await db.query.messages.findFirst({
      where: eq(messagesTable.id, messageId)
    })
    if (!message) {
      return { isSuccess: false, message: "Message not found" }
    }

    const reactions = message.reactions as MessageReactions
    if (!reactions[emoji]) {
      reactions[emoji] = []
    }
    if (!reactions[emoji].includes(userId)) {
      reactions[emoji].push(userId)
    }

    const [updatedMessage] = await db
      .update(messagesTable)
      .set({ reactions })
      .where(eq(messagesTable.id, messageId))
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

export async function removeReactionAction(
  messageId: string,
  userId: string,
  emoji: string
): Promise<ActionState<SelectMessage>> {
  try {
    const message = await db.query.messages.findFirst({
      where: eq(messagesTable.id, messageId)
    })
    if (!message) {
      return { isSuccess: false, message: "Message not found" }
    }

    const reactions = message.reactions as MessageReactions
    if (reactions[emoji]) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== userId)
      if (reactions[emoji].length === 0) {
        delete reactions[emoji]
      }
    }

    const [updatedMessage] = await db
      .update(messagesTable)
      .set({ reactions })
      .where(eq(messagesTable.id, messageId))
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

export async function deleteMessageAction(
  id: string
): Promise<ActionState<void>> {
  try {
    await db.delete(messagesTable).where(eq(messagesTable.id, id))
    return {
      isSuccess: true,
      message: "Message deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting message:", error)
    return { isSuccess: false, message: "Failed to delete message" }
  }
} 