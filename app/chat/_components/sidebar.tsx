"use client"

import {
  createChannelAction,
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
import { SelectChannel, SelectDirectChat, SelectUser } from "@/db/schema"
import { useRealtimeTable } from "@/lib/hooks/use-realtime"
import { cn } from "@/lib/utils"
import { UserButton } from "@clerk/nextjs"
import { Hash, MessageSquare, Plus } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

interface SidebarProps {
  userId: string
}

export function Sidebar({ userId }: SidebarProps) {
  const router = useRouter()
  const params = useParams()
  const [channels, setChannels] = useState<SelectChannel[]>([])
  const [directChats, setDirectChats] = useState<SelectDirectChat[]>([])
  const [chatUsers, setChatUsers] = useState<{ [key: string]: SelectUser }>({})
  const [isCreatingChannel, setIsCreatingChannel] = useState(false)
  const [isCreatingDirectMessage, setIsCreatingDirectMessage] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelType, setNewChannelType] = useState<"public" | "private">("public")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SelectUser[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleChannelInsert = useCallback((newChannel: SelectChannel) => {
    setChannels(prev => [...prev, newChannel])
  }, [])

  const handleChannelUpdate = useCallback((updatedChannel: SelectChannel) => {
    setChannels(prev =>
      prev.map(ch => (ch.id === updatedChannel.id ? updatedChannel : ch))
    )
  }, [])

  const handleChannelDelete = useCallback((deletedChannel: SelectChannel) => {
    setChannels(prev => prev.filter(ch => ch.id !== deletedChannel.id))
  }, [])

  const handleChatInsert = useCallback((newChat: SelectDirectChat) => {
    setDirectChats(prev => [...prev, newChat])
  }, [])

  const handleChatUpdate = useCallback((updatedChat: SelectDirectChat) => {
    setDirectChats(prev =>
      prev.map(chat => (chat.id === updatedChat.id ? updatedChat : chat))
    )
  }, [])

  const handleChatDelete = useCallback((deletedChat: SelectDirectChat) => {
    setDirectChats(prev => prev.filter(chat => chat.id !== deletedChat.id))
  }, [])

  useRealtimeTable<SelectChannel>({
    table: "channels",
    filter: "",
    onInsert: handleChannelInsert,
    onUpdate: handleChannelUpdate,
    onDelete: handleChannelDelete
  })

  useRealtimeTable<SelectDirectChat>({
    table: "direct_chats",
    filter: "",
    onInsert: handleChatInsert,
    onUpdate: handleChatUpdate,
    onDelete: handleChatDelete
  })

  useEffect(() => {
    loadChannels()
    loadDirectChats()
  }, [])

  async function loadChannels() {
    if (!userId) return
    const res = await getUserChannelsAction(userId)
    if (res?.isSuccess) {
      setChannels(res.data)
    }
  }

  async function loadDirectChats() {
    if (!userId) return
    const res = await getUserDirectChatsAction(userId)
    if (res?.isSuccess) {
      setDirectChats(res.data)
      const userPromises = res.data.map(async chat => {
        const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id
        const userRes = await getUserAction(otherUserId)
        if (userRes?.isSuccess) {
          return { [otherUserId]: userRes.data }
        }
        return {}
      })
      const userResults = await Promise.all(userPromises)
      const newChatUsers = userResults.reduce((acc, result) => ({ ...acc, ...result }), {})
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
        creatorId: userId
      },
      [userId]
    )
    if (res.isSuccess) {
      setNewChannelName("")
      setIsCreatingChannel(false)
      router.push(`/chat/channel/${res.data.id}`)
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
    const res = await createDirectChatAction(userId, selectedUserId)
    if (res.isSuccess) {
      setSearchQuery("")
      setSearchResults([])
      setIsCreatingDirectMessage(false)
      router.push(`/chat/dm/${res.data.id}`)
    }
  }

  return (
    <div className="bg-muted/10 flex h-full w-60 flex-col border-r">
      <div className="flex h-12 items-center border-b px-4">
        <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} showName />
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="mt-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold">Channels</h2>
            <Dialog open={isCreatingChannel} onOpenChange={setIsCreatingChannel}>
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
                      onValueChange={(value: "public" | "private") =>
                        setNewChannelType(value)
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
              <Button
                key={channel.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start",
                  params?.channelId === channel.id && "bg-muted"
                )}
                onClick={() => router.push(`/chat/channel/${channel.id}`)}
              >
                <Hash className="mr-2 size-4" />
                {channel.name}
              </Button>
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
                      <div className="text-sm text-muted-foreground">
                        Searching...
                      </div>
                    )}
                    {!isSearching && searchResults.length === 0 && searchQuery && (
                      <div className="text-sm text-muted-foreground">
                        No users found
                      </div>
                    )}
                    {searchResults.map(user => (
                      <Button
                        key={user.id}
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => handleCreateDirectMessage(user.id)}
                      >
                        <div className="flex items-center">
                          <div className="size-8 rounded-full bg-primary/10" />
                          <div className="ml-2">
                            <div className="text-sm font-semibold">
                              {user.fullName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              @{user.username}
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
              const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id
              const otherUser = chatUsers[otherUserId]
              return (
                <Button
                  key={chat.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    params?.chatId === chat.id && "bg-muted"
                  )}
                  onClick={() => router.push(`/chat/dm/${chat.id}`)}
                >
                  <MessageSquare className="mr-2 size-4" />
                  <div className="flex flex-col items-start">
                    <span className="text-sm">
                      {otherUser?.fullName || otherUser?.username || "Loading..."}
                    </span>
                    {otherUser && otherUser.fullName && (
                      <span className="text-xs text-muted-foreground">
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
    </div>
  )
}
