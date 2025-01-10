"use client"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import Link from "@tiptap/extension-link"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  AtSign,
  Bold,
  Code,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Mic,
  Paperclip,
  Send,
  Smile,
  Strikethrough,
  Video
} from "lucide-react"
import { useRef, useState } from "react"

interface RichTextEditorProps {
  onSend: (content: string) => void
  onFileSelect?: (file: File) => void
}

export function RichTextEditor({ onSend, onFileSelect }: RichTextEditorProps) {
  const [content, setContent] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false
      })
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    }
  })

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleSend = () => {
    if (content.trim()) {
      onSend(content)
      editor?.commands.clearContent()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="bg-background rounded-lg border">
      <TooltipProvider>
        <div className="flex items-center gap-1 border-b p-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive("bold") ? "bg-muted" : ""}
              >
                <Bold className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bold</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={editor.isActive("italic") ? "bg-muted" : ""}
              >
                <Italic className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Italic</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={editor.isActive("strike") ? "bg-muted" : ""}
              >
                <Strikethrough className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Strikethrough</p>
            </TooltipContent>
          </Tooltip>

          <div className="bg-border mx-1 h-4 w-px" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  const url = window.prompt("Enter URL")
                  if (url) {
                    editor.chain().focus().setLink({ href: url }).run()
                  }
                }}
                className={editor.isActive("link") ? "bg-muted" : ""}
              >
                <LinkIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Link</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={editor.isActive("code") ? "bg-muted" : ""}
              >
                <Code className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Code</p>
            </TooltipContent>
          </Tooltip>

          <div className="bg-border mx-1 h-4 w-px" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive("bulletList") ? "bg-muted" : ""}
              >
                <List className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Bullet List</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive("orderedList") ? "bg-muted" : ""}
              >
                <ListOrdered className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Numbered List</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <EditorContent
        editor={editor}
        className="prose prose-sm min-h-[100px] max-w-none p-2 focus-within:outline-none"
      />

      <div className="flex items-center gap-2 border-t p-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file && onFileSelect) {
              onFileSelect(file)
            }
          }}
        />

        <Button variant="ghost" size="icon" onClick={handleFileUpload}>
          <Paperclip className="size-4" />
        </Button>

        <Button variant="ghost" size="icon">
          <AtSign className="size-4" />
        </Button>

        <Button variant="ghost" size="icon">
          <Smile className="size-4" />
        </Button>

        <Button variant="ghost" size="icon">
          <Video className="size-4" />
        </Button>

        <Button variant="ghost" size="icon">
          <Mic className="size-4" />
        </Button>

        <div className="ml-auto">
          <Button onClick={handleSend}>
            <Send className="mr-2 size-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
