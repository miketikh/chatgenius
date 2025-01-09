"use server"

import { getWorkspaceAction } from "@/actions/db/workspaces-actions"
import { MessageSquare } from "lucide-react"

interface WorkspacePageProps {
  params: {
    workspaceId: string
  }
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId } = await Promise.resolve(params)
  const workspaceRes = await getWorkspaceAction(workspaceId)
  if (!workspaceRes.isSuccess) {
    return <div>Error loading workspace</div>
  }

  const workspace = workspaceRes.data

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="mb-6 rounded-full bg-blue-100 p-4">
        <MessageSquare className="size-8 text-blue-600" />
      </div>
      <h1 className="mb-2 text-3xl font-bold">Welcome to {workspace.name}</h1>
      <p className="text-muted-foreground mb-8 max-w-md">
        This is your workspace home. Get started by selecting a channel from the
        sidebar or creating a new one.
      </p>
      <div className="text-muted-foreground text-sm">
        <p>Need help? Check out our documentation or contact support.</p>
      </div>
    </div>
  )
}
