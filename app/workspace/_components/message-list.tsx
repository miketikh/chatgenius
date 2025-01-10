"use client"

import { getAttachmentsAction } from "@/actions/db/attachments-actions"
import {
  addDirectMessageReactionAction,
  deleteDirectMessageAction,
  getDirectChatMessagesAction,
  removeDirectMessageReactionAction
} from "@/actions/db/direct-messages-actions"
import {
  addReactionAction,
  deleteMessageAction,
  getChannelMessagesAction,
  removeReactionAction
} from "@/actions/db/messages-actions"
import { AttachmentPreview } from "@/components/ui/attachment-preview"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { SafeHtml } from "@/components/ui/safe-html"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  SelectAttachment,
  SelectDirectMessage,
  SelectMessage
} from "@/db/schema"
import { useRealtimeTable } from "@/lib/hooks/use-realtime"
import { format } from "date-fns"
import { MessageSquare, Minus, Smile } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { DeleteMessageModal } from "./delete-message-modal"
import { EmojiPicker } from "./emoji-picker"
import { transformMessage, useUserMap } from "./user-map-provider"

interface MessageListProps {
  type: "channel" | "direct"
  channelId?: string
  chatId?: string
  userId: string
  onThreadSelect?: (message: SelectMessage | SelectDirectMessage) => void
}

export function MessageList({
  type,
  channelId,
  chatId,
  userId,
  onThreadSelect
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [messages, setMessages] = useState<
    (SelectMessage | SelectDirectMessage)[]
  >([])
  const [openEmojiPicker, setOpenEmojiPicker] = useState<string | null>(null)
  const [attachmentsMap, setAttachmentsMap] = useState<
    Record<string, SelectAttachment[]>
  >({})
  const [messageToDelete, setMessageToDelete] = useState<
    SelectMessage | SelectDirectMessage | null
  >(null)

  const { userMap, bulkLoadUsers } = useUserMap()

  const conversationId = type === "channel" ? channelId : chatId

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      )
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [])

  const handleInsert = useCallback(
    async (newRecord: SelectMessage | SelectDirectMessage) => {
      // Skip thread messages (messages with a parentId)
      if (newRecord.parentId) {
        return
      }

      const msg = transformMessage(newRecord)
      setMessages((prev: (SelectMessage | SelectDirectMessage)[]) => [
        ...prev,
        msg
      ])

      const messageUserId =
        type === "channel"
          ? (msg as SelectMessage).userId
          : (msg as SelectDirectMessage).senderId

      if (!userMap[messageUserId]) {
        await bulkLoadUsers([msg])
      }

      // Load attachments for the new message
      const res = await getAttachmentsAction(
        type === "channel" ? msg.id : undefined,
        type === "direct" ? msg.id : undefined
      )
      if (res.isSuccess) {
        setAttachmentsMap(prev => ({
          ...prev,
          [msg.id]: res.data
        }))
      }

      // Scroll to bottom when new message arrives
      setTimeout(scrollToBottom, 100)
    },
    [userMap, type, scrollToBottom, bulkLoadUsers]
  )

  const handleUpdate = useCallback(
    (updatedRecord: SelectMessage | SelectDirectMessage) => {
      setMessages(prev =>
        prev.map(msg =>
          msg.id === updatedRecord.id ? transformMessage(updatedRecord) : msg
        )
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
        ? `channel_id=eq.${conversationId}`
        : `chat_id=eq.${conversationId}`,
    onInsert: handleInsert,
    onUpdate: handleUpdate,
    onDelete: handleDelete
  })

  useEffect(() => {
    loadMessages()
  }, [conversationId, type])

  // Add effect to scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  async function loadMessages() {
    if (type === "channel" && channelId) {
      const res = await getChannelMessagesAction(channelId)
      if (res.isSuccess) {
        const msgs = res.data.map(transformMessage)
        setMessages(msgs)
        await bulkLoadUsers(msgs)
        await bulkLoadAttachments(msgs)
      }
    } else if (type === "direct" && chatId) {
      const res = await getDirectChatMessagesAction(chatId)
      if (res.isSuccess) {
        const msgs = res.data.map(transformMessage)
        setMessages(msgs)
        await bulkLoadUsers(msgs)
        await bulkLoadAttachments(msgs)
      }
    }
  }

  async function bulkLoadAttachments(
    msgs: (SelectMessage | SelectDirectMessage)[]
  ) {
    for (const msg of msgs) {
      if (!attachmentsMap[msg.id]) {
        const res = await getAttachmentsAction(
          type === "channel" ? msg.id : undefined,
          type === "direct" ? msg.id : undefined
        )
        if (res.isSuccess) {
          setAttachmentsMap(prev => ({
            ...prev,
            [msg.id]: res.data
          }))
        }
      }
    }
  }

  async function handleReaction(messageId: string, emoji: string) {
    setOpenEmojiPicker(null)

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
      const message = messages.find(
        m => m.id === messageId
      ) as SelectDirectMessage
      const reactions = (message.reactions || {}) as Record<string, string[]>
      const hasReacted = reactions[emoji]?.includes(userId)

      if (hasReacted) {
        await removeDirectMessageReactionAction(messageId, userId, emoji)
      } else {
        await addDirectMessageReactionAction(messageId, userId, emoji)
      }
    }
  }

  async function handleDeleteMessage() {
    if (!messageToDelete) return

    if (type === "channel") {
      await deleteMessageAction(messageToDelete.id)
    } else {
      await deleteDirectMessageAction(messageToDelete.id)
    }

    setMessageToDelete(null)
  }

  return (
    <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
      <div className="space-y-4">
        {messages.map(message => {
          const date =
            typeof message.createdAt === "string"
              ? new Date(message.createdAt + "Z")
              : message.createdAt
          const formattedDate = format(date || new Date(), "p")

          const messageUserId =
            type === "channel"
              ? (message as SelectMessage).userId
              : (message as SelectDirectMessage).senderId
          const user = userMap[messageUserId]
          const displayName = user?.username || "Loading..."
          const attachments = attachmentsMap[message.id] || []

          const isAuthor = messageUserId === userId

          return (
            <div key={message.id} className="group flex items-start gap-4">
              <UserAvatar user={user} size="md" />

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{displayName}</span>
                  <span className="text-muted-foreground text-xs">
                    {formattedDate}
                  </span>
                  {isAuthor && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 opacity-0 group-hover:opacity-100"
                      onClick={() => setMessageToDelete(message)}
                    >
                      <Minus className="size-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <SafeHtml content={message.content} />
                {attachments.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {attachments.map(attachment => (
                      <AttachmentPreview
                        key={attachment.id}
                        attachment={attachment}
                      />
                    ))}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-2">
                  <Popover
                    open={openEmojiPicker === message.id}
                    onOpenChange={open =>
                      setOpenEmojiPicker(open ? message.id : null)
                    }
                  >
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
                  {Object.entries(
                    (message.reactions as Record<string, string[]>) || {}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-8 rounded-full p-0"
                    onClick={() => onThreadSelect?.(message)}
                  >
                    <MessageSquare className="size-4" />
                    {message.replyCount > 0 && (
                      <span className="ml-1 text-xs">{message.replyCount}</span>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <DeleteMessageModal
        open={messageToDelete !== null}
        onOpenChange={open => !open && setMessageToDelete(null)}
        onConfirm={handleDeleteMessage}
      />
    </ScrollArea>
  )
}
