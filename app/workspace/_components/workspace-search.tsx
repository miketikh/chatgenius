"use client"

import {
  getSearchableWorkspacesAction,
  joinWorkspaceAction
} from "@/actions/db/workspaces-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectWorkspace } from "@/db/schema"
import { Plus, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

interface WorkspaceSearchProps {
  userId: string
}

export function WorkspaceSearch({ userId }: WorkspaceSearchProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [searchableWorkspaces, setSearchableWorkspaces] = useState<
    SelectWorkspace[]
  >([])

  useEffect(() => {
    loadSearchableWorkspaces()
  }, [])

  async function loadSearchableWorkspaces() {
    setIsLoading(true)
    const res = await getSearchableWorkspacesAction(userId)
    if (res.isSuccess) {
      setSearchableWorkspaces(res.data)
    }
    setIsLoading(false)
  }

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return searchableWorkspaces
    const query = searchQuery.toLowerCase()
    return searchableWorkspaces.filter(ws =>
      ws.name.toLowerCase().includes(query)
    )
  }, [searchableWorkspaces, searchQuery])

  async function handleJoinWorkspace(workspaceId: string) {
    const res = await joinWorkspaceAction(workspaceId, userId)
    if (res.isSuccess) {
      router.refresh()
      router.push(`/workspace/${workspaceId}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => router.push("/workspace/new")}>
          <Plus className="mr-2 size-4" />
          Create New
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            Loading workspaces...
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center text-sm">
            No workspaces found
          </div>
        ) : (
          filteredWorkspaces.map(ws => (
            <div
              key={ws.id}
              className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="flex items-center gap-3">
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
              </div>
              <Button onClick={() => handleJoinWorkspace(ws.id)}>
                Join Workspace
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
