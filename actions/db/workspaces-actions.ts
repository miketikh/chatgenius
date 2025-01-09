"use server"

import { db } from "@/db/db"
import {
    InsertWorkspace,
    InsertWorkspaceMember,
    SelectWorkspace,
    SelectWorkspaceMember,
    workspaceMembersTable,
    workspacesTable
} from "@/db/schema"
import { ActionState } from "@/types"
import { and, eq, or } from "drizzle-orm"

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
    // A user can see public workspaces or any workspace they are a member of
    const results = await db
      .select()
      .from(workspacesTable)
      .leftJoin(
        workspaceMembersTable,
        eq(workspacesTable.id, workspaceMembersTable.workspaceId)
      )
      .where(
        or(
          eq(workspacesTable.type, "public"),
          eq(workspaceMembersTable.userId, userId)
        )
      )

    // results is an array of { workspaces, workspace_members } so map properly
    const data = results.map(r => r.workspaces)
    return {
      isSuccess: true,
      message: "User workspaces retrieved successfully",
      data
    }
  } catch (error) {
    console.error("Error getting user workspaces:", error)
    return { isSuccess: false, message: "Failed to get user workspaces" }
  }
}

export async function joinWorkspaceAction(
  workspaceId: string,
  userId: string
): Promise<ActionState<SelectWorkspaceMember>> {
  try {
    // Insert if not already
    const [member] = await db
      .insert(workspaceMembersTable)
      .values({ workspaceId, userId })
      .onConflictDoNothing()
      .returning()

    if (!member) {
      // onConflictDoNothing means user might already be a member
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
        message: "Joined workspace successfully",
        data: existing
      }
    }

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
    const workspaces = await db.query.workspacesTable.findMany({
      where: or(
        eq(workspacesTable.type, "public"),
        eq(workspacesTable.creatorId, userId)
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