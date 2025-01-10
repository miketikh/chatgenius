"use client"

import DOMPurify from "dompurify"
import { useEffect, useRef } from "react"

interface SafeHtmlProps {
  content: string
  className?: string
}

export function SafeHtml({ content, className }: SafeHtmlProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Configure DOMPurify to allow target="_blank" on links
  const sanitizedContent = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "b",
      "i",
      "em",
      "strong",
      "p",
      "ul",
      "ol",
      "li",
      "a",
      "code",
      "strike"
    ],
    ALLOWED_ATTR: ["href", "target", "rel"]
  })

  // Add target="_blank" and rel="noopener noreferrer" to all links after render
  useEffect(() => {
    if (containerRef.current) {
      const links = containerRef.current.getElementsByTagName("a")
      for (const link of links) {
        link.setAttribute("target", "_blank")
        link.setAttribute("rel", "noopener noreferrer")
      }
    }
  }, [sanitizedContent])

  return (
    <div
      ref={containerRef}
      className={`prose prose-sm dark:prose-invert max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  )
}
