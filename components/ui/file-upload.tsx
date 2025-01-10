"use client"

import { UploadCloud, X } from "lucide-react"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "./button"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  onRemove: () => void
  selectedFile: File | null
  accept?: Record<string, string[]>
}

export function FileUpload({
  onFileSelect,
  onRemove,
  selectedFile,
  accept
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles?.[0]) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles: 1,
    multiple: false
  })

  if (selectedFile) {
    return (
      <div className="bg-muted flex items-center gap-2 rounded-md border p-2">
        <div className="flex-1 truncate text-sm">{selectedFile.name}</div>
        <Button
          onClick={onRemove}
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-auto p-1"
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className="hover:bg-muted/50 flex cursor-pointer items-center justify-center rounded-md border border-dashed p-6 transition-colors"
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-2">
        <UploadCloud className="text-muted-foreground size-10" />
        {isDragActive ? (
          <p className="text-muted-foreground text-sm">Drop the file here</p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Drag & drop a file here, or click to select
          </p>
        )}
      </div>
    </div>
  )
}
