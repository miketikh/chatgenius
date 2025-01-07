"use client"

import {
  addDirectMessageReactionAction,
  getDirectChatMessagesAction,
  removeDirectMessageReactionAction
} from "@/actions/db/direct-messages-actions"
import {
  addReactionAction,
  getChannelMessagesAction,
  removeReactionAction
} from "@/actions/db/messages-actions"
import { getUserAction, getUsersByIdsAction } from "@/actions/db/users-actions"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SelectDirectMessage, SelectMessage, SelectUser } from "@/db/schema"
import { useRealtimeTable } from "@/lib/hooks/use-realtime"
import { format } from "date-fns"
import { MessageSquare, Smile } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { EmojiPicker } from "./emoji-picker"
import { ThreadPanel } from "./thread-panel"

function transformMessage<T extends { createdAt?: string | Date; updatedAt?: string | Date }>(
  message: T
): T {
  const cloned = { ...message }
  if (typeof cloned.createdAt === "string") {
    cloned.createdAt = new Date(cloned.createdAt + "Z")
  }
  if (typeof cloned.updatedAt === "string") {
    cloned.updatedAt = new Date(cloned.updatedAt + "Z")
  }
  return cloned
}

interface MessageListProps {
  type: "channel" | "direct"
  channelId?: string
  chatId?: string
  userId: string
}

export function MessageList({ type, channelId, chatId, userId }: MessageListProps) {
  const [messages, setMessages] = useState<(SelectMessage | SelectDirectMessage)[]>([])
  const [userMap, setUserMap] = useState<Record<string, SelectUser>>({})
  const [selectedMessage, setSelectedMessage] = useState<
    SelectMessage | SelectDirectMessage | null
  >(null)

  const conversationId = type === "channel" ? channelId : chatId

  const handleInsert = useCallback(
    async (newRecord: SelectMessage | SelectDirectMessage) => {
      const msg = transformMessage(newRecord)
      setMessages(prev => [...prev, msg])

      if (!userMap[msg.userId]) {
        const res = await getUserAction(msg.userId)
        if (res?.isSuccess && res.data) {
          setUserMap(prev => ({ ...prev, [msg.userId]: res.data }))
        }
      }
    },
    [userMap]
  )

  const handleUpdate = useCallback(
    (updatedRecord: SelectMessage | SelectDirectMessage) => {
      setMessages(prev =>
        prev.map(msg => (msg.id === updatedRecord.id ? transformMessage(updatedRecord) : msg))
      )
    },
    []
  )

  const handleDelete = useCallback(
    (oldRecord: SelectMessage | SelectDirectMessage) => {
      setMessages(prev => prev.filter(msg => msg.id !== oldRecord.id))
    },
    []
  )

  useRealtimeTable({
    table: type === "channel" ? "messages" : "direct_messages",
    filter:
      type === "channel"
        ? `channel_id=eq.${conversationId || ""}`
        : `chat_id=eq.${conversationId || ""}`,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete
  })

  useEffect(() => {
    loadMessages()
  }, [conversationId, type])

  async function loadMessages() {
    if (type === "channel" && channelId) {
      const res = await getChannelMessagesAction(channelId)
      if (res.isSuccess) {
        const msgs = res.data.map(transformMessage)
        setMessages(msgs)
        await bulkLoadUsers(msgs)
      }
    } else if (type === "direct" && chatId) {
      const res = await getDirectChatMessagesAction(chatId)
      if (res.isSuccess) {
        const msgs = res.data.map(transformMessage)
        setMessages(msgs)
        await bulkLoadUsers(msgs)
      }
    }
  }

  async function bulkLoadUsers(msgs: (SelectMessage | SelectDirectMessage)[]) {
    const uniqueIds = Array.from(new Set(msgs.map(m => m.userId)))
    const missingIds = uniqueIds.filter(id => !userMap[id])
    if (missingIds.length === 0) return

    const res = await getUsersByIdsAction(missingIds)
    if (res.isSuccess) {
      const fetchedUsers = res.data
      const updateMap = { ...userMap }
      fetchedUsers.forEach(u => {
        updateMap[u.id] = u
      })
      setUserMap(updateMap)
    }
  }

  async function handleReaction(messageId: string, emoji: string) {
    if (type === "channel") {
      const message = messages.find(m => m.id === messageId) as SelectMessage
      const reactions = (message.reactions || {}) as Record<string, string[]>
      const hasReacted = reactions[emoji]?.includes(userId)

      if (hasReacted) {
        await removeReactionAction(messageId, userId, emoji)
      } else {
        await addReactionAction(messageId, userId, emoji)
      }
    } else {
      const message = messages.find(m => m.id === messageId) as SelectDirectMessage
      const reactions = (message.reactions || {}) as Record<string, string[]>
      const hasReacted = reactions[emoji]?.includes(userId)

      if (hasReacted) {
        await removeDirectMessageReactionAction(messageId, userId, emoji)
      } else {
        await addDirectMessageReactionAction(messageId, userId, emoji)
      }
    }
  }

  return (
    <div className="flex h-full min-h-0">
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map(message => {
            const date =
              typeof message.createdAt === "string"
                ? new Date(message.createdAt + "Z")
                : message.createdAt
            const formattedDate = format(date || new Date(), "p")

            const user = userMap[message.userId]
            const displayName = user?.username || "Loading..."

            return (
              <div key={message.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-xs text-muted-foreground">{formattedDate}</span>
                  </div>
                  <p className="mt-1">{message.content}</p>
                  {message.fileUrl && (
                    <a
                      href={message.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm text-blue-500 hover:underline"
                    >
                      {message.fileName}
                    </a>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm" className="size-8 rounded-full p-0">
                          <Smile className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <EmojiPicker onEmojiSelect={emoji => handleReaction(message.id, emoji)} />
                      </PopoverContent>
                    </Popover>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 rounded-full p-0"
                      onClick={() => setSelectedMessage(message)}
                    >
                      <MessageSquare className="size-4" />
                      {message.replyCount > 0 && (
                        <span className="ml-1 text-xs">{message.replyCount}</span>
                      )}
                    </Button>
                    {Object.entries((message.reactions as Record<string, string[]>) || {}).map(
                      ([emoji, users]) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-6 gap-1 px-2"
                          onClick={() => handleReaction(message.id, emoji)}
                        >
                          {emoji}
                          <span className="text-xs">{users.length}</span>
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {selectedMessage && (
        <ThreadPanel
          type={type}
          parentMessage={selectedMessage}
          userId={userId}
          onClose={() => setSelectedMessage(null)}
          userMap={userMap}
          bulkLoadUsers={bulkLoadUsers}
        />
      )}
    </div>
  )
}
