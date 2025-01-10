"use client"

import {
  getAttachmentsAction,
  uploadAttachmentAction
} from "@/actions/db/attachments-actions"
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
import { AttachmentPreview } from "@/components/ui/attachment-preview"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { SafeHtml } from "@/components/ui/safe-html"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { UserAvatar } from "@/components/ui/user-avatar"
import {
  SelectAttachment,
  SelectDirectMessage,
  SelectMessage,
  SelectUser
} from "@/db/schema"
import { useRealtimeTable } from "@/lib/hooks/use-realtime"
import { format } from "date-fns"
import { Smile, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { EmojiPicker } from "./emoji-picker"
import { transformMessage } from "./user-map-provider"

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

function getMessageUsername(
  message: SelectMessage | SelectDirectMessage
): string {
  if ("userId" in message && "username" in message) {
    return (message as SelectMessage & { username: string }).username
  }
  return (message as SelectDirectMessage & { senderUsername: string })
    .senderUsername
}

function getUserId(message: SelectMessage | SelectDirectMessage): string {
  if ("userId" in message) {
    return message.userId
  }
  return message.senderId
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
  const [openEmojiPicker, setOpenEmojiPicker] = useState<string | null>(null)
  const [attachmentsMap, setAttachmentsMap] = useState<
    Record<string, SelectAttachment[]>
  >({})

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
        const messageUserId = getUserId(transformed)
        if (!userMap[messageUserId]) {
          await bulkLoadUsers([transformed])
        }

        // Load attachments for the new message
        const res = await getAttachmentsAction(
          type === "channel" ? transformed.id : undefined,
          type === "direct" ? transformed.id : undefined
        )
        if (res.isSuccess) {
          setAttachmentsMap(prev => ({
            ...prev,
            [transformed.id]: res.data
          }))
        }
      }
    },
    [parentId, userMap, bulkLoadUsers, type]
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
        await bulkLoadAttachments([parentMessage, ...data])
      }
    } else {
      const res = await getDirectThreadMessagesAction(parentId)
      if (res.isSuccess) {
        const data = res.data.map(transformMessage)
        setReplies(data)
        // Bulk load all user data if missing
        await bulkLoadUsers(data)
        await bulkLoadAttachments([parentMessage, ...data])
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

  /**
   * Handle posting a new reply
   */
  const handleSubmitReply = async (content: string, file?: File) => {
    if (!content.trim() && !file) return

    let messageId: string | undefined

    if (type === "channel") {
      const pm = parentMessage as SelectMessage
      const res = await createThreadMessageAction({
        channelId: pm.channelId,
        userId,
        content: content.trim(),
        parentId: pm.id
      })
      if (res.isSuccess) {
        messageId = res.data.id
      }
    } else {
      const pm = parentMessage as SelectDirectMessage
      const res = await createDirectThreadMessageAction({
        chatId: pm.chatId,
        senderId: userId,
        content: content.trim(),
        parentId: pm.id
      })
      if (res.isSuccess) {
        messageId = res.data.id
      }
    }

    // Upload file if selected
    if (file && messageId) {
      const formData = new FormData()
      formData.append("file", file)

      await uploadAttachmentAction(
        formData,
        userId,
        type === "channel" ? messageId : undefined,
        type === "direct" ? messageId : undefined
      )
    }
  }

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

  const MessageContent = ({
    message
  }: {
    message: SelectMessage | SelectDirectMessage
  }) => {
    const attachments = attachmentsMap[message.id] || []
    return (
      <>
        <SafeHtml content={message.content} />
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <AttachmentPreview key={attachment.id} attachment={attachment} />
            ))}
          </div>
        )}
        <MessageReactions message={message} />
      </>
    )
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
            <UserAvatar user={userMap[getUserId(parentMessage)]} size="md" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {userMap[getUserId(parentMessage)]?.username || "Loading..."}
                </span>
                <span className="text-muted-foreground text-xs">
                  {format(new Date(parentMessage.createdAt), "p")}
                </span>
              </div>
              <MessageContent message={parentMessage} />
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
                <UserAvatar user={userMap[userKey]} size="md" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{displayName}</span>
                    <span className="text-muted-foreground text-xs">
                      {format(date || new Date(), "p")}
                    </span>
                  </div>
                  <MessageContent message={reply} />
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Replace the form with RichTextEditor */}
      <div className="border-t p-4">
        <RichTextEditor
          onSend={handleSubmitReply}
          placeholder="Reply to thread..."
          accept={{
            "image/*": [],
            "application/pdf": []
          }}
        />
      </div>
    </div>
  )
}
