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
import { SelectDirectMessage, SelectMessage } from "@/db/schema"
import {
    useRealtimeDirectMessages,
    useRealtimeMessages
} from "@/lib/hooks/use-realtime"
import { format } from "date-fns"
import { X } from "lucide-react"
import { useEffect, useState } from "react"

interface ThreadPanelProps {
  type: "channel" | "direct"
  parentMessage: SelectMessage | SelectDirectMessage
  userId: string
  onClose: () => void
}

export function ThreadPanel({
  type,
  parentMessage,
  userId,
  onClose
}: ThreadPanelProps) {
  const [replies, setReplies] = useState<(SelectMessage | SelectDirectMessage)[]>(
    []
  )
  const [newReply, setNewReply] = useState("")

  useEffect(() => {
    loadReplies()
  }, [parentMessage.id])

  // Set up real-time listeners for replies
  useRealtimeMessages(
    type === "channel" ? parentMessage.id : "",
    newMessage => {
      if (type === "channel" && newMessage.parentId === parentMessage.id) {
        setReplies(prev => [...prev, newMessage as SelectMessage])
      }
    },
    updatedMessage => {
      if (type === "channel") {
        setReplies(prev =>
          prev.map(msg =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        )
      }
    },
    deletedMessage => {
      if (type === "channel") {
        setReplies(prev => prev.filter(msg => msg.id !== deletedMessage.id))
      }
    }
  )

  useRealtimeDirectMessages(
    type === "direct" ? parentMessage.id : "",
    newMessage => {
      if (type === "direct" && newMessage.parentId === parentMessage.id) {
        setReplies(prev => [...prev, newMessage as SelectDirectMessage])
      }
    },
    updatedMessage => {
      if (type === "direct") {
        setReplies(prev =>
          prev.map(msg =>
            msg.id === updatedMessage.id ? updatedMessage : msg
          )
        )
      }
    },
    deletedMessage => {
      if (type === "direct") {
        setReplies(prev => prev.filter(msg => msg.id !== deletedMessage.id))
      }
    }
  )

  async function loadReplies() {
    if (type === "channel") {
      const res = await getThreadMessagesAction(parentMessage.id)
      if (res.isSuccess) {
        setReplies(res.data)
      }
    } else {
      const res = await getDirectThreadMessagesAction(parentMessage.id)
      if (res.isSuccess) {
        setReplies(res.data)
      }
    }
  }

  async function handleSubmitReply(e: React.FormEvent) {
    e.preventDefault()
    if (!newReply.trim()) return

    if (type === "channel") {
      const message = parentMessage as SelectMessage
      await createThreadMessageAction({
        channelId: message.channelId,
        userId,
        username: message.username,
        content: newReply,
        parentId: message.id
      })
    } else {
      const message = parentMessage as SelectDirectMessage
      await createDirectThreadMessageAction({
        chatId: message.chatId,
        senderId: userId,
        senderUsername: message.senderUsername,
        content: newReply,
        parentId: message.id
      })
    }

    setNewReply("")
  }

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
          {/* Parent Message */}
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
          {replies.map(reply => (
            <div key={reply.id} className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {type === "direct"
                      ? (reply as SelectDirectMessage).senderUsername
                      : (reply as SelectMessage).username}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {format(new Date(reply.createdAt), "p")}
                  </span>
                </div>
                <p className="mt-1">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

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