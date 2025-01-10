"use client"

import { EmojiPicker } from "@/app/workspace/_components/emoji-picker"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
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
  Bold,
  Code,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Paperclip,
  Send,
  Smile,
  Strikethrough
} from "lucide-react"
import { useRef, useState } from "react"

interface RichTextEditorProps {
  onSend: (content: string, file?: File) => void
  disabled?: boolean
  accept?: Record<string, string[]>
}

export function RichTextEditor({
  onSend,
  disabled = false,
  accept = {
    "image/*": [],
    "application/pdf": []
  }
}: RichTextEditorProps) {
  const [content, setContent] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isEmojiOpen, setIsEmojiOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        validate: href =>
          /^(https?:\/\/)?[\w-]+(\.[\w-]+)+[/#?]?.*$/.test(href || "")
      })
    ],
    content: "",
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm min-h-[100px] max-w-none p-2 focus-within:outline-none text-foreground prose-a:text-blue-400"
      }
    }
  })

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleSend = () => {
    if (content.trim() || selectedFile) {
      onSend(content, selectedFile ?? undefined)
      editor?.commands.clearContent()
      setSelectedFile(null)
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    editor?.commands.insertContent(emoji)
    setIsEmojiOpen(false)
  }

  const setLink = () => {
    const url = window.prompt("Enter URL")
    if (url) {
      // Add https:// if no protocol is specified
      const fullUrl = url.match(/^https?:\/\//) ? url : `https://${url}`
      editor?.chain().focus().setLink({ href: fullUrl }).run()
    }
  }

  if (!editor) {
    return null
  }

  return (
    <div className="bg-background rounded-lg border">
      {selectedFile && (
        <div className="border-b p-2">
          <div className="flex items-center gap-2">
            <span className="text-sm">{selectedFile.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              Remove
            </Button>
          </div>
        </div>
      )}

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
                onClick={setLink}
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

      <EditorContent editor={editor} />

      <div className="flex items-center gap-2 border-t p-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={Object.keys(accept).join(",")}
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) {
              setSelectedFile(file)
            }
          }}
        />

        <Button variant="ghost" size="icon" onClick={handleFileUpload}>
          <Paperclip className="size-4" />
        </Button>
        <Popover open={isEmojiOpen} onOpenChange={setIsEmojiOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon">
              <Smile className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </PopoverContent>
        </Popover>

        <div className="ml-auto">
          <Button
            onClick={handleSend}
            disabled={disabled || (!content.trim() && !selectedFile)}
          >
            <Send className="mr-2 size-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
