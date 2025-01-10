"use server"

import { db } from "@/db/db"
import { InsertUser, SelectUser, usersTable } from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, ilike, inArray, not, or } from "drizzle-orm"

export async function createUserAction(
  user: InsertUser
): Promise<ActionState<SelectUser>> {
  try {
    const [newUser] = await db
      .insert(usersTable)
      .values(user)
      .onConflictDoUpdate({
        target: usersTable.id,
        set: {
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          imageUrl: user.imageUrl,
          updatedAt: new Date()
        }
      })
      .returning()
    return {
      isSuccess: true,
      message: "User created/updated successfully",
      data: newUser
    }
  } catch (error) {
    console.error("Error creating/updating user:", error)
    return { isSuccess: false, message: "Failed to create/update user" }
  }
}

export async function getUserAction(id: string): Promise<ActionState<SelectUser>> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(usersTable.id, id)
    })
    if (!user) {
      return { isSuccess: false, message: "User not found" }
    }
    return {
      isSuccess: true,
      message: "User retrieved successfully",
      data: user
    }
  } catch (error) {
    console.error("Error getting user:", error)
    return { isSuccess: false, message: "Failed to get user" }
  }
}

export async function updateUserAction(
  id: string,
  data: Partial<InsertUser>
): Promise<ActionState<SelectUser>> {
  try {
    const [updatedUser] = await db
      .update(usersTable)
      .set(data)
      .where(eq(usersTable.id, id))
      .returning()
    return {
      isSuccess: true,
      message: "User updated successfully",
      data: updatedUser
    }
  } catch (error) {
    console.error("Error updating user:", error)
    return { isSuccess: false, message: "Failed to update user" }
  }
}

export async function deleteUserAction(id: string): Promise<ActionState<void>> {
  try {
    await db.delete(usersTable).where(eq(usersTable.id, id))
    return {
      isSuccess: true,
      message: "User deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting user:", error)
    return { isSuccess: false, message: "Failed to delete user" }
  }
}

export async function searchUsersAction(
  query: string,
  currentUserId: string
): Promise<ActionState<SelectUser[]>> {
  try {
    const users = await db.query.users.findMany({
      where: and(
        or(
          ilike(usersTable.username, `%${query}%`),
          ilike(usersTable.fullName, `%${query}%`)
        ),
        not(eq(usersTable.id, currentUserId)) // Exclude current user
      )
    })
    return {
      isSuccess: true,
      message: "Users found successfully",
      data: users
    }
  } catch (error) {
    console.error("Error searching users:", error)
    return { isSuccess: false, message: "Failed to search users" }
  }
}

export async function getUsersByIdsAction(
  userIds: string[]
): Promise<ActionState<SelectUser[]>> {
  try {
    const users = await db.query.users.findMany({
      where: inArray(usersTable.id, userIds)
    })
    return {
      isSuccess: true,
      message: "Users retrieved successfully",
      data: users
    }
  } catch (error) {
    console.error("Error getting users:", error)
    return { isSuccess: false, message: "Failed to get users" }
  }
}
