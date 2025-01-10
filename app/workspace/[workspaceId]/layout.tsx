"use server"

import { getUserChannelsAction } from "@/actions/db/channels-actions"
import { getUserDirectChatsAction } from "@/actions/db/direct-messages-actions"
import { updateLastWorkspaceAction } from "@/actions/db/profiles-actions"
import { getUserAction } from "@/actions/db/users-actions"
import {
  getUserWorkspacesAction,
  getWorkspaceAction
} from "@/actions/db/workspaces-actions"
import { Sidebar } from "@/app/workspace/_components/sidebar"
import { TopSearchBar } from "@/app/workspace/_components/top-search-bar"
import { WorkspacesSidebar } from "@/app/workspace/_components/workspaces-sidebar"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: {
    workspaceId: string
  }
}

export default async function WorkspaceLayout({
  children,
  params
}: WorkspaceLayoutProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const { workspaceId } = await Promise.resolve(params)

  // Get the user
  const userRes = await getUserAction(userId)
  if (!userRes.isSuccess) {
    return <div>Error loading user</div>
  }

  // Get all workspaces for the user
  const userWorkspacesRes = await getUserWorkspacesAction(userId)
  if (!userWorkspacesRes.isSuccess) {
    return <div>Error loading workspaces</div>
  }

  // Get the current workspace
  const workspaceRes = await getWorkspaceAction(workspaceId)
  if (!workspaceRes.isSuccess) {
    return <div>Error loading workspace</div>
  }

  // Update last used workspace
  await updateLastWorkspaceAction(userId, workspaceId)

  // **NEW**: Fetch channels / direct chats on the server
  const userChannelsRes = await getUserChannelsAction(userId, workspaceId)
  const userDirectChatsRes = await getUserDirectChatsAction(userId, workspaceId)

  const channels = userChannelsRes.isSuccess ? userChannelsRes.data : []
  const directChats = userDirectChatsRes.isSuccess
    ? userDirectChatsRes.data
    : []

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar with workspaces */}
      <div className="w-16 bg-blue-900">
        <WorkspacesSidebar
          userId={userId}
          userWorkspaces={userWorkspacesRes.data}
          user={userRes.data}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex min-h-12 items-center bg-blue-900 p-2">
          <TopSearchBar userId={userId} workspaceId={workspaceId} />
        </div>

        {/* Content area with sidebar and main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main sidebar with channels/DMs */}
          {/* Pass pre-fetched channels and directChats down */}
          <Sidebar
            userId={userId}
            workspaceId={workspaceId}
            serverChannels={channels}
            serverDirectChats={directChats}
          />

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
