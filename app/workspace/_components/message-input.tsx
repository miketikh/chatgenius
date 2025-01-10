"use client"

import { uploadAttachmentAction } from "@/actions/db/attachments-actions"
import { createDirectMessageAction } from "@/actions/db/direct-messages-actions"
import { createMessageAction } from "@/actions/db/messages-actions"
import { Button } from "@/components/ui/button"
import { FileUpload } from "@/components/ui/file-upload"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
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
  const [content, setContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !selectedFile) return

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
      if (selectedFile && messageId) {
        const formData = new FormData()
        formData.append("file", selectedFile)

        await uploadAttachmentAction(
          formData,
          userId,
          type === "channel" ? messageId : undefined,
          type === "direct" ? messageId : undefined
        )
      }

      setContent("")
      setSelectedFile(null)
    } catch (error) {
      console.error("Error sending message:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4">
      {selectedFile && (
        <FileUpload
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
          onRemove={() => setSelectedFile(null)}
          accept={{
            "image/*": [],
            "application/pdf": []
          }}
        />
      )}

      <div className="flex items-center gap-2">
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="resize-none"
          rows={1}
        />

        {!selectedFile && (
          <FileUpload
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            onRemove={() => setSelectedFile(null)}
            accept={{
              "image/*": [],
              "application/pdf": []
            }}
          />
        )}

        <Button
          type="submit"
          size="icon"
          disabled={isLoading || (!content.trim() && !selectedFile)}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </form>
  )
}
