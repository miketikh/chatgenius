"use client"

import { createDirectMessageAction } from "@/actions/db/direct-messages-actions"
import { createMessageAction } from "@/actions/db/messages-actions"
import { uploadFileAction } from "@/actions/upload-actions"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"

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
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() && !fileInputRef.current?.files?.length) return

    try {
      let fileData = undefined

      if (fileInputRef.current?.files?.length) {
        setIsUploading(true)
        const file = fileInputRef.current.files[0]
        const uploadRes = await uploadFileAction(file, userId)
        if (!uploadRes.isSuccess) {
          throw new Error("Failed to upload file")
        }
        fileData = uploadRes.data
        setIsUploading(false)
      }

      if (type === "channel" && channelId) {
        await createMessageAction({
          channelId,
          userId,
          content: content.trim(),
          fileUrl: fileData?.fileUrl,
          fileName: fileData?.fileName,
          fileType: fileData?.fileType,
          reactions: {}
        })
      } else if (type === "direct" && chatId) {
        await createDirectMessageAction({
          chatId,
          senderId: userId,
          content: content.trim(),
          fileUrl: fileData?.fileUrl,
          fileName: fileData?.fileName,
          fileType: fileData?.fileType,
          reactions: {}
        })
      }

      setContent("")
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-t p-4">
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={() => {
            // Trigger submit when file is selected
            if (fileInputRef.current?.files?.length) {
              handleSubmit(new Event("submit") as any)
            }
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-10"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Paperclip className="size-5" />
        </Button>
        <Textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Type a message..."
          className="min-h-[40px] flex-1 resize-none"
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="size-10"
          disabled={
            isUploading ||
            (!content.trim() && !fileInputRef.current?.files?.length)
          }
        >
          <Send className="size-5" />
        </Button>
      </div>
    </form>
  )
}
