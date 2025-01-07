"use client"

import {
  createDirectThreadMessageAction,
  getDirectThreadMessagesAction
} from "@/actions/db/direct-messages-actions"
import {
  createThreadMessageAction,
  getThreadMessagesAction
} from "@/actions/db/messages-actions"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { SelectDirectMessage, SelectMessage, SelectUser } from "@/db/schema"
import { useRealtimeTable } from "@/lib/hooks/use-realtime"
import { format } from "date-fns"
import { X } from "lucide-react"
import React, { useCallback, useEffect, useState } from "react"

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
          username: pm.username,
          content: newReply,
          parentId: pm.id
        })
      } else {
        const pm = parentMessage as SelectDirectMessage
        await createDirectThreadMessageAction({
          chatId: pm.chatId,
          senderId: userId,
          senderUsername: pm.senderUsername,
          content: newReply,
          parentId: pm.id
        })
      }

      setNewReply("")
    },
    [newReply, parentMessage, type, userId]
  )

  /**
   * Render
   */
  return (
    <div className="flex h-full w-[400px] flex-col border-l">
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
                  {type === "direct"
                    ? (parentMessage as SelectDirectMessage).senderUsername
                    : (parentMessage as SelectMessage).username}
                </span>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(parentMessage.createdAt), "p")}
                </span>
              </div>
              <p className="mt-1">{parentMessage.content}</p>
            </div>
          </div>
          <Separator />

          {/* Replies */}
          {replies.map(reply => {
            // For direct messages we typically have senderId/senderUsername
            const userKey =
              type === "direct"
                ? (reply as SelectDirectMessage).senderId
                : (reply as SelectMessage).userId
            const displayName = userMap[userKey]?.username || ""

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
                  {/* Potential: if you want to show real user’s displayName from userMap */}
                  {/* <p>Posted by: {userMap[userKey]?.displayName || displayName}</p> */}
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
