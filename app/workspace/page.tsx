"use server"

import { getProfileAction } from "@/actions/db/profiles-actions"
import { getUserWorkspacesAction } from "@/actions/db/workspaces-actions"
import { auth } from "@clerk/nextjs/server"
import { MessageSquare } from "lucide-react"
import { redirect } from "next/navigation"
import { WorkspaceSearch } from "./_components/workspace-search"

/**
 * This page shows when user is logged in and we direct them to /workspace.
 * They can see existing workspaces or create a new one.
 */
export default async function WorkspaceIndexPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/")
  }

  // Check for last used workspace
  const profileRes = await getProfileAction(userId)
  if (profileRes.isSuccess && profileRes.data?.lastWorkspaceId) {
    redirect(`/workspace/${profileRes.data.lastWorkspaceId}`)
  }

  const workspaceRes = await getUserWorkspacesAction(userId)
  if (!workspaceRes.isSuccess) {
    return <div>Error loading workspaces</div>
  }
  const workspaces = workspaceRes.data

  if (workspaces.length === 1) {
    // If there's exactly one workspace, just go there
    redirect(`/workspace/${workspaces[0].id}`)
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-950">
      <div className="mt-12 flex items-center">
        <MessageSquare className="mr-2 size-12 text-white" />
        <h1 className="text-4xl font-bold text-white">ChatGenius</h1>
      </div>

      <div className="mx-auto mt-12 w-full max-w-2xl rounded-xl border bg-white/50 p-8 shadow-lg backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/50">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-bold">
            Welcome to Your Workspaces
          </h2>
          <p className="text-muted-foreground">
            Join an existing workspace or create your own to get started
          </p>
        </div>

        {workspaces.length > 0 && (
          <div className="mb-8">
            <h3 className="mb-4 text-lg font-semibold">Your Workspaces</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {workspaces.map(ws => (
                <a
                  key={ws.id}
                  href={`/workspace/${ws.id}`}
                  className="flex items-center gap-3 rounded-lg border bg-white p-4 shadow-sm transition-colors hover:bg-blue-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500">
                    <span className="text-lg font-bold text-white">
                      {ws.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium">{ws.name}</div>
                    <div className="text-muted-foreground text-sm">
                      {ws.type === "public" ? "Public" : "Private"} Workspace
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                or join another workspace
              </span>
            </div>
          </div>

          <WorkspaceSearch userId={userId} />
        </div>
      </div>
    </div>
  )
}
