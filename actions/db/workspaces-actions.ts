"use server"

import { db } from "@/db/db"
import {
  InsertWorkspace,
  InsertWorkspaceMember,
  SelectWorkspace,
  workspaceMembersTable,
  workspacesTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, exists, not } from "drizzle-orm"

export async function createWorkspaceAction(
  workspaceData: InsertWorkspace,
  initialMembers: string[]
): Promise<ActionState<SelectWorkspace>> {
  try {
    const [newWorkspace] = await db
      .insert(workspacesTable)
      .values(workspaceData)
      .returning()

    // Add members (including the creator)
    const memberInserts: InsertWorkspaceMember[] = initialMembers.map(userId => ({
      workspaceId: newWorkspace.id,
      userId
    }))
    await db.insert(workspaceMembersTable).values(memberInserts)

    return {
      isSuccess: true,
      message: "Workspace created successfully",
      data: newWorkspace
    }
  } catch (error) {
    console.error("Error creating workspace:", error)
    return { isSuccess: false, message: "Failed to create workspace" }
  }
}

export async function getWorkspaceAction(
  workspaceId: string
): Promise<ActionState<SelectWorkspace>> {
  try {
    const workspace = await db.query.workspaces.findFirst({
      where: eq(workspacesTable.id, workspaceId)
    })
    if (!workspace) {
      return { isSuccess: false, message: "Workspace not found" }
    }
    return {
      isSuccess: true,
      message: "Workspace retrieved successfully",
      data: workspace
    }
  } catch (error) {
    console.error("Error getting workspace:", error)
    return { isSuccess: false, message: "Failed to get workspace" }
  }
}

export async function getUserWorkspacesAction(
  userId: string
): Promise<ActionState<SelectWorkspace[]>> {
  try {
    // Only get workspaces where the user is a member
    const workspaces = await db.query.workspaces.findMany({
      where: exists(
        db
          .select()
          .from(workspaceMembersTable)
          .where(
            and(
              eq(workspaceMembersTable.userId, userId),
              eq(workspaceMembersTable.workspaceId, workspacesTable.id)
            )
          )
      ),
      orderBy: workspacesTable.name
    })

    return {
      isSuccess: true,
      message: "User workspaces retrieved successfully",
      data: workspaces
    }
  } catch (error) {
    console.error("Error getting user workspaces:", error)
    return { isSuccess: false, message: "Failed to get user workspaces" }
  }
}

export async function joinWorkspaceAction(
  workspaceId: string,
  userId: string
) {
  try {
    // Insert only if not already present
    const [member] = await db
      .insert(workspaceMembersTable)
      .values({ workspaceId, userId })
      .onConflictDoNothing({
        // IMPORTANT: specify the same columns used in the unique constraint
        target: [workspaceMembersTable.workspaceId, workspaceMembersTable.userId]
      })
      .returning()

    // If `member` is undefined, it means the row already exists or the insert failed.
    if (!member) {
      // Double-check the existing row:
      const existing = await db.query.workspaceMembers.findFirst({
        where: and(
          eq(workspaceMembersTable.workspaceId, workspaceId),
          eq(workspaceMembersTable.userId, userId)
        )
      })

      if (!existing) {
        return { isSuccess: false, message: "Failed to join workspace" }
      }
      return {
        isSuccess: true,
        message: "Already a member of workspace",
        data: existing
      }
    }

    // Otherwise, the insert succeeded and we have a fresh row
    return {
      isSuccess: true,
      message: "Joined workspace successfully",
      data: member
    }
  } catch (error) {
    console.error("Error joining workspace:", error)
    return { isSuccess: false, message: "Failed to join workspace" }
  }
}

export async function deleteWorkspaceAction(
  workspaceId: string
): Promise<ActionState<void>> {
  try {
    await db
      .delete(workspacesTable)
      .where(eq(workspacesTable.id, workspaceId))
    return {
      isSuccess: true,
      message: "Workspace deleted successfully"
    }
  } catch (error) {
    console.error("Error deleting workspace:", error)
    return { isSuccess: false, message: "Failed to delete workspace" }
  }
}

export async function getSearchableWorkspacesAction(
  userId: string
): Promise<ActionState<SelectWorkspace[]>> {
  try {
    // Get public workspaces where the user is NOT a member
    const workspaces = await db.query.workspaces.findMany({
      where: and(
        eq(workspacesTable.type, "public"),
        not(
          exists(
            db
              .select()
              .from(workspaceMembersTable)
              .where(
                and(
                  eq(workspaceMembersTable.userId, userId),
                  eq(workspaceMembersTable.workspaceId, workspacesTable.id)
                )
              )
          )
        )
      ),
      orderBy: workspacesTable.name
    })

    return {
      isSuccess: true,
      message: "Workspaces retrieved successfully",
      data: workspaces
    }
  } catch (error) {
    console.error("Error getting workspaces:", error)
    return { isSuccess: false, message: "Failed to get workspaces" }
  }
}