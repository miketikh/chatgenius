"use client"

import {
  createChannelAction,
  deleteChannelAction,
  getUserChannelsAction
} from "@/actions/db/channels-actions"
import {
  createDirectChatAction,
  getUserDirectChatsAction
} from "@/actions/db/direct-messages-actions"
import { getUserAction, searchUsersAction } from "@/actions/db/users-actions"
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
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import { SelectChannel, SelectDirectChat, SelectUser } from "@/db/schema"
import { useRealtimeTable } from "@/lib/hooks/use-realtime"
import { cn } from "@/lib/utils"
import { Hash, MessageSquare, Minus, Plus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface SidebarProps {
  userId: string
  workspaceId: string
}

export function Sidebar({ userId, workspaceId }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const [channels, setChannels] = useState<SelectChannel[]>([])
  const [directChats, setDirectChats] = useState<SelectDirectChat[]>([])
  const [chatUsers, setChatUsers] = useState<{ [key: string]: SelectUser }>({})
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

  const workspaceParam = params?.workspaceId
  const channelParam = params?.channelId
  const chatParam = params?.chatId

  // Realtime hooks, but filter by workspace if desired
  useRealtimeTable<SelectChannel>({
    table: "channels",
    filter: `workspace_id=eq.${workspaceId}`, // only subscribe to channels in this workspace
    onInsert: useCallback(newChannel => {
      setChannels(prev => [...prev, newChannel])
    }, []),
    onUpdate: useCallback(updatedChannel => {
      setChannels(prev =>
        prev.map(ch => (ch.id === updatedChannel.id ? updatedChannel : ch))
      )
    }, []),
    onDelete: useCallback(deletedChannel => {
      setChannels(prev => prev.filter(ch => ch.id !== deletedChannel.id))
    }, [])
  })

  useRealtimeTable<SelectDirectChat>({
    table: "direct_chats",
    filter: `workspace_id=eq.${workspaceId}`,
    onInsert: useCallback(newChat => {
      setDirectChats(prev => [...prev, newChat])
    }, []),
    onUpdate: useCallback(updatedChat => {
      setDirectChats(prev =>
        prev.map(ch => (ch.id === updatedChat.id ? updatedChat : ch))
      )
    }, []),
    onDelete: useCallback(deletedChat => {
      setDirectChats(prev => prev.filter(ch => ch.id !== deletedChat.id))
    }, [])
  })

  useEffect(() => {
    loadChannels()
    loadDirectChats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function loadChannels() {
    if (!userId || !workspaceId) return
    const res = await getUserChannelsAction(userId, workspaceId)
    if (res.isSuccess) {
      setChannels(res.data)
    }
  }

  async function loadDirectChats() {
    if (!userId || !workspaceId) return
    const res = await getUserDirectChatsAction(userId, workspaceId)
    if (res.isSuccess) {
      setDirectChats(res.data)
      const userPromises = res.data.map(async chat => {
        const otherUserId =
          chat.user1Id === userId ? chat.user2Id : chat.user1Id
        const userRes = await getUserAction(otherUserId)
        if (userRes?.isSuccess) {
          return { [otherUserId]: userRes.data }
        }
        return {}
      })
      const userResults = await Promise.all(userPromises)
      const newChatUsers = userResults.reduce(
        (acc, result) => ({ ...acc, ...result }),
        {}
      )
      setChatUsers(newChatUsers)
    }
  }

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
      router.push(`/workspace/${workspaceId}/channel/${res.data.id}`)
    }
  }

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
      <div className="flex h-12 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          <span className="font-semibold">ChatGenius</span>
        </div>
        <ThemeSwitcher />
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
