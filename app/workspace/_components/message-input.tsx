"use client"

import { uploadAttachmentAction } from "@/actions/db/attachments-actions"
import { createDirectMessageAction } from "@/actions/db/direct-messages-actions"
import { createMessageAction } from "@/actions/db/messages-actions"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { useState } from "react"

interface MessageInputProps {
  type: "channel" | "direct"
  channelId?: string
  chatId?: string
  userId: string
}

export function MessageInput({
  type,
  channelId,
  chatId,
  userId
}: MessageInputProps) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(content: string, file?: File) {
    if (!content.trim() && !file) return

    setIsLoading(true)
    try {
      let messageId: string | undefined

      // Create the message first
      if (type === "channel" && channelId) {
        const res = await createMessageAction({
          channelId,
          userId,
          content: content.trim()
        })
        if (res.isSuccess) {
          messageId = res.data.id
        }
      } else if (type === "direct" && chatId) {
        const res = await createDirectMessageAction({
          chatId,
          senderId: userId,
          content: content.trim()
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
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4">
      <RichTextEditor
        onSend={handleSubmit}
        disabled={isLoading}
        accept={{
          "image/*": [],
          "application/pdf": []
        }}
      />
    </div>
  )
}
