"use client"

import {
  addDirectMessageReactionAction,
  createDirectThreadMessageAction,
  getDirectThreadMessagesAction,
  removeDirectMessageReactionAction
} from "@/actions/db/direct-messages-actions"
import {
  addReactionAction,
  createThreadMessageAction,
  getThreadMessagesAction,
  removeReactionAction
} from "@/actions/db/messages-actions"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { SelectDirectMessage, SelectMessage, SelectUser } from "@/db/schema"
import { useRealtimeTable } from "@/lib/hooks/use-realtime"
import { format } from "date-fns"
import { Smile, X } from "lucide-react"
import React, { useCallback, useEffect, useState } from "react"
import { EmojiPicker } from "./emoji-picker"

interface ThreadPanelProps {
  type: "channel" | "direct"
  parentMessage: SelectMessage | SelectDirectMessage
  userId: string
  onClose: () => void

  // New props for user caching (like in MessageList)
  userMap: Record<string, SelectUser>
  bulkLoadUsers: (
    msgs: (SelectMessage | SelectDirectMessage)[]
  ) => Promise<void>
}

function transformMessage<T extends { createdAt?: string | Date }>(msg: T) {
  const cloned = { ...msg }
  if (typeof cloned.createdAt === "string") {
    cloned.createdAt = new Date(cloned.createdAt + "Z")
  }
  return cloned
}

function getMessageUsername(
  message: SelectMessage | SelectDirectMessage
): string {
  if ("username" in message) {
    return message.username
  }
  return message.senderUsername
}

export function ThreadPanel({
  type,
  parentMessage,
  userId,
  onClose,
  userMap,
  bulkLoadUsers
}: ThreadPanelProps) {
  const [replies, setReplies] = useState<
    (SelectMessage | SelectDirectMessage)[]
  >([])
  const [newReply, setNewReply] = useState("")
  const [openEmojiPicker, setOpenEmojiPicker] = useState<string | null>(null)

  // We only care about reloading if the parentMessage's ID changes.
  // Make sure the parent doesn't constantly recreate `parentMessage`.
  const parentId = parentMessage.id

  /**
   * Realtime hooks for inserted/updated/deleted replies
   */
  const handleReplyInsert = useCallback(
    async (newRecord: SelectMessage | SelectDirectMessage) => {
      // Only add if it belongs to this thread
      if (newRecord.parentId === parentId) {
        const transformed = transformMessage(newRecord)
        setReplies(prev => [...prev, transformed])

        // Also load user if missing
        if (
          !userMap[
            transformed.userId || (transformed as SelectDirectMessage).senderId
          ]
        ) {
          await bulkLoadUsers([transformed])
        }
      }
    },
    [parentId, userMap, bulkLoadUsers]
  )

  const handleReplyUpdate = useCallback(
    (updated: SelectMessage | SelectDirectMessage) => {
      setReplies(prev =>
        prev.map(msg =>
          msg.id === updated.id ? transformMessage(updated) : msg
        )
      )
    },
    []
  )

  const handleReplyDelete = useCallback(
    (oldRecord: SelectMessage | SelectDirectMessage) => {
      setReplies(prev => prev.filter(msg => msg.id !== oldRecord.id))
    },
    []
  )

  useRealtimeTable({
    table: type === "channel" ? "messages" : "direct_messages",
    filter: `parent_id=eq.${parentId}`,
    onInsert: handleReplyInsert,
    onUpdate: handleReplyUpdate,
    onDelete: handleReplyDelete
  })

  /**
   * Load initial replies on mount or if parentId changes
   */
  useEffect(() => {
    // Only load if we have a valid parentId
    if (parentId) {
      loadReplies()
    }
  }, [parentId, type]) // do not include newReply, userMap, etc.

  async function loadReplies() {
    if (type === "channel") {
      const res = await getThreadMessagesAction(parentId)
      if (res.isSuccess) {
        const data = res.data.map(transformMessage)
        setReplies(data)
        // Bulk load all user data if missing
        await bulkLoadUsers(data)
      }
    } else {
      const res = await getDirectThreadMessagesAction(parentId)
      if (res.isSuccess) {
        const data = res.data.map(transformMessage)
        setReplies(data)
        // Bulk load all user data if missing
        await bulkLoadUsers(data)
      }
    }
  }

  /**
   * Handle posting a new reply
   */
  const handleSubmitReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!newReply.trim()) return

      if (type === "channel") {
        const pm = parentMessage as SelectMessage
        await createThreadMessageAction({
          channelId: pm.channelId,
          userId,
          username: getMessageUsername(pm),
          content: newReply,
          parentId: pm.id
        })
      } else {
        const pm = parentMessage as SelectDirectMessage
        await createDirectThreadMessageAction({
          chatId: pm.chatId,
          senderId: userId,
          senderUsername: getMessageUsername(pm),
          content: newReply,
          parentId: pm.id
        })
      }

      setNewReply("")
    },
    [newReply, parentMessage, type, userId]
  )

  async function handleReaction(messageId: string, emoji: string) {
    setOpenEmojiPicker(null)

    if (type === "channel") {
      const message =
        messageId === parentMessage.id
          ? (parentMessage as SelectMessage)
          : (replies.find(m => m.id === messageId) as SelectMessage)
      const reactions = (message.reactions || {}) as Record<string, string[]>
      const hasReacted = reactions[emoji]?.includes(userId)

      if (hasReacted) {
        await removeReactionAction(messageId, userId, emoji)
      } else {
        await addReactionAction(messageId, userId, emoji)
      }
    } else {
      const message =
        messageId === parentMessage.id
          ? (parentMessage as SelectDirectMessage)
          : (replies.find(m => m.id === messageId) as SelectDirectMessage)
      const reactions = (message.reactions || {}) as Record<string, string[]>
      const hasReacted = reactions[emoji]?.includes(userId)

      if (hasReacted) {
        await removeDirectMessageReactionAction(messageId, userId, emoji)
      } else {
        await addDirectMessageReactionAction(messageId, userId, emoji)
      }
    }
  }

  const MessageReactions = ({
    message
  }: {
    message: SelectMessage | SelectDirectMessage
  }) => (
    <div className="mt-2 flex items-center gap-2">
      <Popover
        open={openEmojiPicker === message.id}
        onOpenChange={open => setOpenEmojiPicker(open ? message.id : null)}
      >
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="size-8 rounded-full p-0">
            <Smile className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0">
          <EmojiPicker
            onEmojiSelect={emoji => handleReaction(message.id, emoji)}
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
    </div>
  )

  const getUserId = (message: SelectMessage | SelectDirectMessage) => {
    if ("userId" in message) {
      return message.userId
    }
    return message.senderId
  }

  /**
   * Render
   */
  return (
    <div className="bg-background flex h-full w-[400px] flex-col border-l">
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-semibold">Thread</h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* Parent message */}
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {userMap[getUserId(parentMessage)]?.username || "Loading..."}
                </span>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(parentMessage.createdAt), "p")}
                </span>
              </div>
              <p className="mt-1">{parentMessage.content}</p>
              <MessageReactions message={parentMessage} />
            </div>
          </div>
          <Separator />

          {/* Replies */}
          {replies.map(reply => {
            const userKey = getUserId(reply)
            const displayName = userMap[userKey]?.username || "Loading..."

            const date =
              typeof reply.createdAt === "string"
                ? new Date(reply.createdAt + "Z")
                : reply.createdAt

            return (
              <div key={reply.id} className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(date || new Date(), "p")}
                    </span>
                  </div>
                  <p className="mt-1">{reply.content}</p>
                  <MessageReactions message={reply} />
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Form to submit a new reply */}
      <form onSubmit={handleSubmitReply} className="border-t p-4">
        <Textarea
          value={newReply}
          onChange={e => setNewReply(e.target.value)}
          placeholder="Reply in thread..."
          className="mb-2"
          rows={3}
        />
        <Button type="submit" disabled={!newReply.trim()}>
          Reply
        </Button>
      </form>
    </div>
  )
}
