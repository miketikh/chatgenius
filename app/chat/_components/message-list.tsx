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
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SelectDirectMessage, SelectMessage } from "@/db/schema"
import {
  useRealtimeDirectMessages,
  useRealtimeMessages
} from "@/lib/hooks/use-realtime"
import { format } from "date-fns"
import { MessageSquare, Smile } from "lucide-react"
import { useEffect, useState } from "react"
import { EmojiPicker } from "./emoji-picker"
import { ThreadPanel } from "./thread-panel"

// Utility function to transform snake_case to camelCase
function transformMessage(message: any): SelectMessage | SelectDirectMessage {
  const transformed: any = {}
  for (const [key, value] of Object.entries(message)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
      letter.toUpperCase()
    )
    // Convert created_at and updated_at to Date objects
    if (key === "created_at" || key === "updated_at") {
      // Ensure we parse the UTC date string correctly
      transformed[camelKey] = new Date(
        (value as string).replace(" ", "T") + "Z"
      )
    } else {
      transformed[camelKey] = value
    }
  }
  return transformed
}

interface MessageListProps {
  type: "channel" | "direct"
  channelId?: string
  chatId?: string
  userId: string
}

export function MessageList({
  type,
  channelId,
  chatId,
  userId
}: MessageListProps) {
  const [messages, setMessages] = useState<
    (SelectMessage | SelectDirectMessage)[]
  >([])
  const [selectedMessage, setSelectedMessage] = useState<
    SelectMessage | SelectDirectMessage | null
  >(null)

  useEffect(() => {
    loadMessages()
  }, [channelId, chatId])

  // Set up real-time listeners for channel messages
  useRealtimeMessages(
    type === "channel" ? channelId || "" : "",
    newMessage => {
      console.log("New message timestamp:", (newMessage as any).created_at)
      if (type === "channel") {
        setMessages(prev => [...prev, transformMessage(newMessage)])
      }
    },
    updatedMessage => {
      if (type === "channel") {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === updatedMessage.id
              ? transformMessage(updatedMessage)
              : msg
          )
        )
      }
    },
    deletedMessage => {
      if (type === "channel") {
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id))
      }
    }
  )

  useRealtimeDirectMessages(
    type === "direct" ? chatId || "" : "",
    newMessage => {
      console.log(
        "New direct message timestamp:",
        (newMessage as any).created_at
      )
      if (type === "direct") {
        const transformed = transformMessage(newMessage)
        console.log("Transformed message:", transformed)
        setMessages(prev => [...prev, transformed])
      }
    },
    updatedMessage => {
      if (type === "direct") {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === updatedMessage.id
              ? transformMessage(updatedMessage)
              : msg
          )
        )
      }
    },
    deletedMessage => {
      if (type === "direct") {
        setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id))
      }
    }
  )

  async function loadMessages() {
    if (type === "channel" && channelId) {
      const res = await getChannelMessagesAction(channelId)
      if (res.isSuccess) {
        console.log(
          "Loaded channel messages timestamps:",
          res.data.map(m => m.createdAt)
        )
        setMessages(res.data)
      }
    } else if (type === "direct" && chatId) {
      const res = await getDirectChatMessagesAction(chatId)
      if (res.isSuccess) {
        console.log(
          "Loaded direct messages timestamps:",
          res.data.map(m => m.createdAt)
        )
        setMessages(res.data)
      }
    }
  }

  async function handleReaction(messageId: string, emoji: string) {
    if (type === "channel") {
      const message = messages.find(m => m.id === messageId) as SelectMessage
      const reactions = message.reactions as Record<string, string[]>
      const hasReacted = reactions[emoji]?.includes(userId)

      if (hasReacted) {
        await removeReactionAction(messageId, userId, emoji)
      } else {
        await addReactionAction(messageId, userId, emoji)
      }
    } else {
      const message = messages.find(
        m => m.id === messageId
      ) as SelectDirectMessage
      const reactions = message.reactions as Record<string, string[]>
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
            const messageUserId =
              type === "direct"
                ? (message as SelectDirectMessage).senderId
                : (message as SelectMessage).userId

            const date =
              typeof message.createdAt === "string"
                ? new Date(message.createdAt + "Z")
                : message.createdAt

            const formattedDate = format(date, "p")

            return (
              <div key={message.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">
                      {type === "direct"
                        ? (message as SelectDirectMessage).senderUsername
                        : (message as SelectMessage).username}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formattedDate}
                    </span>
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 rounded-full p-0"
                        >
                          <Smile className="size-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 p-0">
                        <EmojiPicker
                          onEmojiSelect={emoji =>
                            handleReaction(message.id, emoji)
                          }
                        />
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
                        <span className="ml-1 text-xs">
                          {message.replyCount}
                        </span>
                      )}
                    </Button>
                    {Object.entries(
                      message.reactions as Record<string, string[]>
                    ).map(([emoji, users]) => (
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
                    ))}
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
        />
      )}
    </div>
  )
}
