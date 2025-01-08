"use client"

import { updateUserAction } from "@/actions/db/users-actions"
import {
  createWorkspaceAction,
  joinWorkspaceAction
} from "@/actions/db/workspaces-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SelectUser, SelectWorkspace } from "@/db/schema"
import { cn } from "@/lib/utils"
import { SignOutButton } from "@clerk/nextjs"
import { Bell, Home, LogOut, MessageSquare, Plus, Settings } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface WorkspacesSidebarProps {
  userId: string
  userWorkspaces: SelectWorkspace[]
  user?: SelectUser
}

export function WorkspacesSidebar({
  userId,
  userWorkspaces,
  user
}: WorkspacesSidebarProps) {
  const router = useRouter()
  const [showDialog, setShowDialog] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  )

  async function handleStatusChange(status: "online" | "offline" | "away") {
    const res = await updateUserAction(userId, { status })
    if (res.isSuccess) {
      router.refresh()
    }
  }

  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-500",
    away: "bg-yellow-500"
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault()
    if (!workspaceName.trim()) return

    const res = await createWorkspaceAction(
      {
        name: workspaceName.trim(),
        description: "",
        type: "public",
        creatorId: userId
      },
      [userId]
    )

    if (res.isSuccess) {
      setShowDialog(false)
      setWorkspaceName("")
      setSelectedWorkspace(res.data.id)
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
    <div className="flex size-full flex-col text-white">
      {/* Workspaces */}
      <div className="flex flex-col gap-2 p-2">
        {userWorkspaces.map(ws => (
          <button
            key={ws.id}
            className={cn(
              "flex size-12 items-center justify-center rounded-md bg-white/10 transition-colors hover:bg-white/20",
              selectedWorkspace === ws.id && "bg-white/30"
            )}
            onClick={() => setSelectedWorkspace(ws.id)}
          >
            <span className="text-lg font-semibold">
              {ws.name.charAt(0).toUpperCase()}
            </span>
          </button>
        ))}

        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <button className="flex size-12 items-center justify-center rounded-md border-2 border-dashed border-white/30 transition-colors hover:bg-white/20">
              <Plus className="size-6" />
            </button>
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

      {/* Navigation */}
      <div className="flex flex-1 flex-col gap-2 p-2">
        <button
          className="flex size-12 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.push("/chat")}
        >
          <Home className="size-5" />
        </button>
        <button
          className="flex size-12 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.push("/chat/dms")}
        >
          <MessageSquare className="size-5" />
        </button>
        <button
          className="flex size-12 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.push("/chat/activity")}
        >
          <Bell className="size-5" />
        </button>
      </div>

      {/* Profile */}
      <div className="relative p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative size-12 focus:outline-none">
              <div className="size-full overflow-hidden rounded-full ring-1 ring-white/20">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-blue-600">
                    <span className="text-lg font-semibold text-white">
                      {user?.fullName?.charAt(0) ||
                        user?.username?.charAt(0) ||
                        "?"}
                    </span>
                  </div>
                )}
              </div>
              <div
                className={cn(
                  "absolute bottom-0 right-0 size-3 rounded-full border-2 border-blue-900",
                  statusColors[user?.status || "offline"]
                )}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex items-center gap-2 p-2">
              <div className="relative size-10 overflow-hidden rounded-full ring-1 ring-white/20">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-blue-600">
                    <span className="text-base font-semibold text-white">
                      {user?.fullName?.charAt(0) ||
                        user?.username?.charAt(0) ||
                        "?"}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white",
                    statusColors[user?.status || "offline"]
                  )}
                />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold">{user?.fullName}</span>
                <span className="text-muted-foreground text-xs">
                  @{user?.username}
                </span>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => handleStatusChange("online")}>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-green-500" />
                Set as active
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("away")}>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-yellow-500" />
                Set as away
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusChange("offline")}>
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-gray-500" />
                Set as offline
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <a
                href="https://accounts.clerk.com/account"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <Settings className="size-4" />
                Manage Account
              </a>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <SignOutButton>
                <button className="flex w-full items-center gap-2 text-red-600">
                  <LogOut className="size-4" />
                  Sign Out
                </button>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
