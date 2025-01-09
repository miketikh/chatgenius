"use server"

import { getUserWorkspacesAction } from "@/actions/db/workspaces-actions"
import { auth } from "@clerk/nextjs/server"
import Link from "next/link"
import { redirect } from "next/navigation"

/**
 * This page shows when user is logged in and we direct them to /workspace.
 * They can see existing workspaces or create a new one.
 */
export default async function WorkspaceIndexPage() {
  const { userId } = await auth()
  if (!userId) {
    redirect("/")
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
    <div className="flex flex-col items-center justify-center p-8">
      <h1 className="mb-4 text-2xl font-bold">Your Workspaces</h1>

      {workspaces.length === 0 && (
        <div className="mb-4">
          <p>You have no workspaces. Create one to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {workspaces.map(ws => (
          <Link
            key={ws.id}
            href={`/workspace/${ws.id}`}
            className="block rounded bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
          >
            {ws.name}
          </Link>
        ))}
      </div>

      <div className="mt-6">
        <Link
          href="/workspace/new"
          className="rounded border border-blue-600 px-4 py-2 text-blue-600 hover:bg-blue-50"
        >
          Create New Workspace
        </Link>
      </div>
    </div>
  )
}
