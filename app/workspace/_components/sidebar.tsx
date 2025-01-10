"use client"

import {
  createChannelAction,
  deleteChannelAction
} from "@/actions/db/channels-actions"
import { createDirectChatAction } from "@/actions/db/direct-messages-actions"
import { getUserAction, searchUsersAction } from "@/actions/db/users-actions"
import { getWorkspaceAction } from "@/actions/db/workspaces-actions"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  SelectChannel,
  SelectDirectChat,
  SelectUser,
  SelectWorkspace
} from "@/db/schema"
import { useRealtimeTable } from "@/lib/hooks/use-realtime"
import { cn } from "@/lib/utils"
import { Hash, MessageSquare, Minus, Plus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface SidebarProps {
  userId: string
  workspaceId: string

  // Now we receive pre-fetched channels and direct chats from the server
  serverChannels?: SelectChannel[]
  serverDirectChats?: SelectDirectChat[]
}

export function Sidebar({
  userId,
  workspaceId,
  serverChannels = [],
  serverDirectChats = []
}: SidebarProps) {
  const router = useRouter()
  const params = useParams()

  // We store them as state but start from server props
  const [channels, setChannels] = useState<SelectChannel[]>(serverChannels)
  const [directChats, setDirectChats] =
    useState<SelectDirectChat[]>(serverDirectChats)
  const [chatUsers, setChatUsers] = useState<{ [key: string]: SelectUser }>({})
  const [workspace, setWorkspace] = useState<Pick<SelectWorkspace, "name">>()
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [isCreatingDirectMessage, setIsCreatingDirectMessage] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelType, setNewChannelType] = useState<"public" | "private">(
    "public"
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SelectUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [channelToDelete, setChannelToDelete] = useState<SelectChannel | null>(
    null
  )
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const channelParam = params?.channelId
  const chatParam = params?.chatId

  // Realtime subscriptions (optional).
  // These do NOT cause repeated server fetch calls, they just sync new data in real-time.
  useRealtimeTable<SelectChannel>({
    table: "channels",
    filter: `workspace_id=eq.${workspaceId}`,
    onInsert: useCallback((newChannel: SelectChannel) => {
      setChannels(prev => [...prev, newChannel])
    }, []),
    onUpdate: useCallback((updatedChannel: SelectChannel) => {
      setChannels(prev =>
        prev.map(ch => (ch.id === updatedChannel.id ? updatedChannel : ch))
      )
    }, []),
    onDelete: useCallback((deletedChannel: SelectChannel) => {
      setChannels(prev => prev.filter(ch => ch.id !== deletedChannel.id))
    }, [])
  })

  useRealtimeTable<SelectDirectChat>({
    table: "direct_chats",
    filter: `workspace_id=eq.${workspaceId}`,
    onInsert: useCallback((newChat: SelectDirectChat) => {
      setDirectChats(prev => [...prev, newChat])
    }, []),
    onUpdate: useCallback((updatedChat: SelectDirectChat) => {
      setDirectChats(prev =>
        prev.map(ch => (ch.id === updatedChat.id ? updatedChat : ch))
      )
    }, []),
    onDelete: useCallback((deletedChat: SelectDirectChat) => {
      setDirectChats(prev => prev.filter(ch => ch.id !== deletedChat.id))
    }, [])
  })

  // Load basic workspace data once, if needed:
  useEffect(() => {
    let isMounted = true
    async function loadWorkspace() {
      const res = await getWorkspaceAction(workspaceId)
      if (res.isSuccess && isMounted) {
        setWorkspace({ name: res.data.name })
      }
    }
    loadWorkspace()
    return () => {
      isMounted = false
    }
  }, [workspaceId])

  // For direct chats, we need the "other user" details
  useEffect(() => {
    async function fillChatUsers() {
      // Collect user IDs
      const userIds: string[] = []
      for (const chat of directChats) {
        const otherUserId =
          chat.user1Id === userId ? chat.user2Id : chat.user1Id
        // Avoid duplicates in multiple chats
        if (!chatUsers[otherUserId]) {
          userIds.push(otherUserId)
        }
      }
      if (userIds.length === 0) return

      // Load them from DB
      const fetches = await Promise.all(userIds.map(id => getUserAction(id)))
      const newMap: Record<string, SelectUser> = {}
      fetches.forEach(fr => {
        if (fr.isSuccess && fr.data) {
          newMap[fr.data.id] = fr.data
        }
      })

      setChatUsers(prev => ({ ...prev, ...newMap }))
    }
    fillChatUsers()
  }, [directChats, userId, chatUsers])

  // Creating a channel
  async function handleCreateChannel(e: React.FormEvent) {
    e.preventDefault()
    if (!newChannelName.trim()) return
    const res = await createChannelAction(
      {
        name: newChannelName.trim(),
        type: newChannelType,
        creatorId: userId,
        workspaceId
      },
      [userId]
    )
    if (res.isSuccess) {
      setNewChannelName("")
      setIsCreatingChannel(false)
      // Jump to newly created channel
      router.push(`/workspace/${workspaceId}/channel/${res.data.id}`)
    }
  }

  // Creating a direct message chat
  async function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    setIsSearching(true)
    const res = await searchUsersAction(query, userId)
    if (res.isSuccess) {
      setSearchResults(res.data)
    }
    setIsSearching(false)
  }

  async function handleCreateDirectMessage(selectedUserId: string) {
    const res = await createDirectChatAction(
      userId,
      selectedUserId,
      workspaceId
    )
    if (res.isSuccess) {
      setSearchQuery("")
      setSearchResults([])
      setIsCreatingDirectMessage(false)
      router.push(`/workspace/${workspaceId}/dm/${res.data.id}`)
    }
  }

  // Deleting a channel
  async function handleDeleteChannel() {
    if (!channelToDelete) return
    const res = await deleteChannelAction(channelToDelete.id)
    if (res.isSuccess) {
      if (channelParam === channelToDelete.id) {
        router.push(`/workspace/${workspaceId}`)
      }
      setChannels(prev => prev.filter(ch => ch.id !== channelToDelete.id))
      setChannelToDelete(null)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <div className="bg-muted/10 flex h-full w-60 flex-col border-r">
      <div className="flex h-12 items-center gap-2 border-b px-4">
        <div className="bg-primary/10 flex size-6 shrink-0 items-center justify-center rounded-md">
          <MessageSquare className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">
            {workspace?.name || "Loading..."}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold">Channels</h2>
            <Dialog
              open={isCreatingChannel}
              onOpenChange={setIsCreatingChannel}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-4">
                  <Plus className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Channel</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateChannel} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Channel Name</Label>
                    <Input
                      id="name"
                      value={newChannelName}
                      onChange={e => setNewChannelName(e.target.value)}
                      placeholder="e.g. general"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Channel Type</Label>
                    <Select
                      value={newChannelType}
                      onValueChange={(val: "public" | "private") =>
                        setNewChannelType(val)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit">Create Channel</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-2 space-y-1">
            {channels.map(channel => (
              <div key={channel.id} className="group relative">
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start pr-10",
                    channelParam === channel.id && "bg-muted"
                  )}
                  onClick={() =>
                    router.push(
                      `/workspace/${workspaceId}/channel/${channel.id}`
                    )
                  }
                >
                  <Hash className="mr-2 size-4" />
                  {channel.name}
                </Button>
                {channel.creatorId === userId && (
                  <button
                    onClick={() => {
                      setChannelToDelete(channel)
                      setIsDeleteDialogOpen(true)
                    }}
                    className="absolute right-2 top-1/2 hidden -translate-y-1/2 p-1 text-red-500 group-hover:block"
                    title="Delete channel"
                  >
                    <Minus className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold">Direct Messages</h2>
            <Dialog
              open={isCreatingDirectMessage}
              onOpenChange={setIsCreatingDirectMessage}
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="size-4">
                  <Plus className="size-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Direct Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="search">Search Users</Label>
                    <Input
                      id="search"
                      value={searchQuery}
                      onChange={handleSearch}
                      placeholder="Search by username or full name"
                    />
                  </div>
                  <div className="space-y-2">
                    {isSearching && (
                      <div className="text-muted-foreground text-sm">
                        Searching...
                      </div>
                    )}
                    {!isSearching &&
                      searchResults.length === 0 &&
                      searchQuery && (
                        <div className="text-muted-foreground text-sm">
                          No users found
                        </div>
                      )}
                    {searchResults.map(u => (
                      <Button
                        key={u.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleCreateDirectMessage(u.id)}
                      >
                        <div className="flex items-center">
                          <div className="bg-primary/10 size-8 rounded-full" />
                          <div className="ml-2">
                            <div className="text-sm font-semibold">
                              {u.fullName}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              @{u.username}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-2 space-y-1">
            {directChats.map(chat => {
              const otherUserId =
                chat.user1Id === userId ? chat.user2Id : chat.user1Id
              const otherUser = chatUsers[otherUserId]
              return (
                <Button
                  key={chat.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    chatParam === chat.id && "bg-muted"
                  )}
                  onClick={() =>
                    router.push(`/workspace/${workspaceId}/dm/${chat.id}`)
                  }
                >
                  <MessageSquare className="mr-2 size-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm">
                      {otherUser?.fullName ||
                        otherUser?.username ||
                        "Loading..."}
                    </span>
                    {otherUser && otherUser.fullName && (
                      <span className="text-muted-foreground text-xs">
                        @{otherUser.username}
                      </span>
                    )}
                  </div>
                </Button>
              )
            })}
          </div>
        </div>
      </ScrollArea>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Channel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete{" "}
              <span className="font-bold">{channelToDelete?.name}</span>?<br />
              This will delete <strong>all messages</strong> in that channel.
            </p>
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteChannel}>
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
