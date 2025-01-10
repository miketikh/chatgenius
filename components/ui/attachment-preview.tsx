"use client"

import { getSignedUrlAction } from "@/actions/db/attachments-actions"
import { SelectAttachment } from "@/db/schema"
import { FileIcon, ImageIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "./button"

interface AttachmentPreviewProps {
  attachment: SelectAttachment
  onDelete?: () => void
  showDelete?: boolean
}

export function AttachmentPreview({
  attachment,
  onDelete,
  showDelete = false
}: AttachmentPreviewProps) {
  const [isImageError, setIsImageError] = useState(false)
  const [signedUrl, setSignedUrl] = useState<string>("")
  const isImage = attachment.type.startsWith("image/") && !isImageError

  useEffect(() => {
    async function getUrl() {
      try {
        const res = await getSignedUrlAction(attachment.name)
        if (res.isSuccess) {
          setSignedUrl(res.data)
        } else {
          throw new Error(res.message)
        }
      } catch (error) {
        console.error("Error getting signed URL:", error)
        setIsImageError(true)
      }
    }
    getUrl()
  }, [attachment.name])

  if (!signedUrl) {
    return null // Or a loading state
  }

  return (
    <div className="bg-muted group relative inline-block max-w-xs overflow-hidden rounded-md border">
      {showDelete && onDelete && (
        <Button
          onClick={onDelete}
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 z-10 size-6 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <XIcon className="size-4" />
        </Button>
      )}

      {isImage ? (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Image
            src={signedUrl}
            alt={attachment.name}
            width={300}
            height={200}
            className="h-[200px] w-[300px] object-cover"
            onError={() => setIsImageError(true)}
          />
        </a>
      ) : (
        <a
          href={signedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-2"
        >
          {attachment.type.includes("pdf") ? (
            <FileIcon className="size-4" />
          ) : (
            <ImageIcon className="size-4" />
          )}
          <span className="truncate text-sm">{attachment.name}</span>
        </a>
      )}
    </div>
  )
}
