"use client"

import { updateUserAction } from "@/actions/db/users-actions"
import {
  createWorkspaceAction,
  getSearchableWorkspacesAction,
  joinWorkspaceAction
} from "@/actions/db/workspaces-actions"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { SelectUser, SelectWorkspace } from "@/db/schema"
import { cn } from "@/lib/utils"
import { useClerk } from "@clerk/clerk-react"
import { SignOutButton } from "@clerk/nextjs"
import {
  ArrowLeft,
  Bell,
  Home,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings
} from "lucide-react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface WorkspacesSidebarProps {
  userId: string
  userWorkspaces: SelectWorkspace[]
  user?: SelectUser
}

type WorkspaceView = "list" | "add" | "search" | "create"

export function WorkspacesSidebar({
  userId,
  userWorkspaces,
  user
}: WorkspacesSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const clerk = useClerk()
  const [showDialog, setShowDialog] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  // Get current workspace ID from the URL
  const currentWorkspaceId = pathname.split("/workspace/")[1]?.split("/")[0]

  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    currentWorkspaceId || userWorkspaces[0]?.id || null
  )
  const [currentView, setCurrentView] = useState<WorkspaceView>("list")
  const [searchableWorkspaces, setSearchableWorkspaces] = useState<
    SelectWorkspace[]
  >([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)

  // Update selectedWorkspace when URL changes
  useEffect(() => {
    if (currentWorkspaceId) {
      setSelectedWorkspace(currentWorkspaceId)
    }
  }, [currentWorkspaceId])

  // Load searchable workspaces when entering search view
  useEffect(() => {
    if (currentView === "search") {
      loadSearchableWorkspaces()
    }
  }, [currentView])

  async function loadSearchableWorkspaces() {
    setIsSearchLoading(true)
    const res = await getSearchableWorkspacesAction(userId)
    if (res.isSuccess) {
      setSearchableWorkspaces(res.data)
    }
    setIsSearchLoading(false)
  }

  // Filter workspaces based on search query
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return searchableWorkspaces
    const query = searchQuery.toLowerCase()
    return searchableWorkspaces.filter(ws =>
      ws.name.toLowerCase().includes(query)
    )
  }, [searchableWorkspaces, searchQuery])

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
      setCurrentView("list")
      router.refresh()
    }
  }

  async function handleJoinWorkspace(workspaceId: string) {
    const res = await joinWorkspaceAction(workspaceId, userId)
    if (res.isSuccess) {
      setSelectedWorkspace(workspaceId)
      setCurrentView("list")
      router.refresh()
      router.push(`/workspace/${workspaceId}`)
    }
  }

  function renderWorkspaceList() {
    return (
      <>
        <div className="p-4 pb-2">
          <h2 className="text-lg font-semibold">Workspaces</h2>
          <p className="text-muted-foreground text-sm">
            Switch or add a workspace
          </p>
        </div>
        <div className="max-h-96 overflow-auto">
          {userWorkspaces.map(ws => {
            const isCurrent = ws.id === currentWorkspaceId
            return (
              <button
                key={ws.id}
                className={cn(
                  "hover:bg-accent flex w-full items-center gap-3 px-4 py-2 transition-colors",
                  isCurrent && "bg-accent/50 cursor-default",
                  !isCurrent && "hover:bg-accent"
                )}
                onClick={() => {
                  if (!isCurrent) {
                    setSelectedWorkspace(ws.id)
                    router.push(`/workspace/${ws.id}`)
                  }
                }}
                disabled={isCurrent}
              >
                <div className="bg-primary flex size-8 items-center justify-center rounded">
                  <span className="text-primary-foreground text-sm font-semibold">
                    {ws.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-between">
                  <span className="font-medium">{ws.name}</span>
                  {isCurrent && (
                    <span className="text-muted-foreground text-xs">
                      (current)
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => setCurrentView("add")}
          >
            <Plus className="size-4" />
            Add Workspace
          </Button>
        </div>
      </>
    )
  }

  function renderAddWorkspace() {
    return (
      <>
        <div className="flex items-center gap-2 border-b p-4">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setCurrentView("list")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Add Workspace</h2>
            <p className="text-muted-foreground text-sm">
              Join existing or create new
            </p>
          </div>
        </div>
        <div className="space-y-2 p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => setCurrentView("search")}
          >
            <Search className="size-4" />
            Search Existing Workspace
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => {
              setCurrentView("create")
              setShowDialog(true)
            }}
          >
            <Plus className="size-4" />
            Create New Workspace
          </Button>
        </div>
      </>
    )
  }

  function renderSearchWorkspace() {
    const isUserWorkspace = (workspaceId: string) =>
      userWorkspaces.some(ws => ws.id === workspaceId)

    return (
      <>
        <div className="flex items-center gap-2 border-b p-4">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => setCurrentView("add")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Search Workspaces</h2>
            <p className="text-muted-foreground text-sm">
              Find and join a workspace
            </p>
          </div>
        </div>
        <div className="p-4">
          <div className="space-y-4">
            <Input
              placeholder="Search by workspace name..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <div className="space-y-2">
              {isSearchLoading ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  Loading workspaces...
                </div>
              ) : filteredWorkspaces.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  No workspaces found
                </div>
              ) : (
                filteredWorkspaces.map(ws => {
                  const isMember = isUserWorkspace(ws.id)
                  return (
                    <div
                      key={ws.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-primary flex size-8 items-center justify-center rounded">
                          <span className="text-primary-foreground text-sm font-semibold">
                            {ws.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{ws.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {ws.type === "public" ? "Public" : "Private"}
                          </span>
                        </div>
                      </div>
                      {isMember ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWorkspace(ws.id)
                            router.push(`/workspace/${ws.id}`)
                          }}
                        >
                          Open
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleJoinWorkspace(ws.id)}
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="flex size-full flex-col text-white">
      {/* Workspaces */}
      <div className="flex flex-col gap-2 p-2">
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "flex size-12 items-center justify-center rounded-md bg-white/10 transition-colors hover:bg-white/20",
                selectedWorkspace && "bg-white/30"
              )}
            >
              <span className="text-lg font-semibold">
                {userWorkspaces
                  .find(ws => ws.id === selectedWorkspace)
                  ?.name.charAt(0)
                  .toUpperCase() ||
                  userWorkspaces[0]?.name.charAt(0).toUpperCase()}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start" side="right">
            {currentView === "list" && renderWorkspaceList()}
            {currentView === "add" && renderAddWorkspace()}
            {currentView === "search" && renderSearchWorkspace()}
          </PopoverContent>
        </Popover>
      </div>

      <Dialog
        open={showDialog}
        onOpenChange={open => {
          setShowDialog(open)
          if (!open) setCurrentView("list")
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Workspace</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Workspace Name</Label>
              <Input
                id="workspaceName"
                placeholder="Ex: Acme Corp"
                value={workspaceName}
                onChange={e => setWorkspaceName(e.target.value)}
              />
              <p className="text-muted-foreground text-sm">
                This is the name of your company, team or organization.
              </p>
            </div>
            <Button type="submit" className="w-full">
              Create Workspace
            </Button>
          </form>
        </DialogContent>
      </Dialog>

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

            <DropdownMenuItem onSelect={() => clerk.openUserProfile()}>
              <div className="flex items-center gap-2">
                <Settings className="size-4" />
                Manage Account
              </div>
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
