"use client"

import { useRouter } from "next/navigation"
import { SelectWorkspace } from "@/db/schema"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createWorkspaceAction,
  joinWorkspaceAction
} from "@/actions/db/workspaces-actions"
import { useState } from "react"
import { Hash } from "lucide-react"

interface WorkspacesSidebarProps {
  userId: string
  userWorkspaces: SelectWorkspace[]
}

export function WorkspacesSidebar({
  userId,
  userWorkspaces
}: WorkspacesSidebarProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceName.trim()) return

    // By default, create a public workspace
    const res = await createWorkspaceAction(
      {
        name: workspaceName.trim(),
        description: "",
        type: "public",
        creatorId: userId
      },
      [userId] // initial members
    )

    if (res.isSuccess) {
      setShowDialog(false)
      setWorkspaceName("")
      router.refresh()
    }
  }

  async function handleJoinWorkspace(workspaceId: string) {
    const res = await joinWorkspaceAction(workspaceId, userId)
    if (res.isSuccess) {
      router.refresh()
    }
  }

  return (
    <div className="bg-muted/10 flex h-full w-52 flex-col border-r">
      <div className="flex h-12 items-center justify-center border-b px-2">
        <h1 className="text-sm font-bold">Workspaces</h1>
      </div>

      <div className="flex-1 overflow-auto">
        {userWorkspaces.map(ws => (
          <Button
            key={ws.id}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              // In a Slack-like app, selecting a workspace would update the channels sidebar
              // For now, we just show an alert or handle logic as needed
              alert(`Selected workspace: ${ws.name}`)
            }}
          >
            <Hash className="mr-2 size-4" />
            {ws.name}
          </Button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t p-2">
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button variant="default" className="mr-2">
              Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Workspace</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <Label htmlFor="workspaceName">Name</Label>
                <Input
                  id="workspaceName"
                  value={workspaceName}
                  onChange={e => setWorkspaceName(e.target.value)}
                />
              </div>
              <Button type="submit">Create</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
