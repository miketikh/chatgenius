"use client"

import { SelectAttachment } from "@/db/schema"
import { FileIcon, ImageIcon, XIcon } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
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
  const isImage = attachment.type.startsWith("image/") && !isImageError

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
          href={attachment.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Image
            src={attachment.url}
            alt={attachment.name}
            width={300}
            height={200}
            className="h-[200px] w-[300px] object-cover"
            onError={() => setIsImageError(true)}
          />
        </a>
      ) : (
        <a
          href={attachment.url}
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
