"use server"

import { db } from "@/db/db"
import { InsertUser, SelectUser, usersTable } from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, ilike, not, or } from "drizzle-orm"

export async function createUserAction(
  user: InsertUser
): Promise<ActionState<SelectUser>> {
  try {
    const [newUser] = await db.insert(usersTable).values(user).returning()
    return {
      isSuccess: true,
      message: "User created successfully",
      data: newUser
    }
  } catch (error) {
    console.error("Error creating user:", error)
    return { isSuccess: false, message: "Failed to create user" }
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

export async function updateUserStatusAction(
  id: string,
  status: "online" | "offline" | "away"
): Promise<ActionState<SelectUser>> {
  try {
    const [updatedUser] = await db
      .update(usersTable)
      .set({
        status,
        lastSeen: new Date()
      })
      .where(eq(usersTable.id, id))
      .returning()
    return {
      isSuccess: true,
      message: "User status updated successfully",
      data: updatedUser
    }
  } catch (error) {
    console.error("Error updating user status:", error)
    return { isSuccess: false, message: "Failed to update user status" }
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