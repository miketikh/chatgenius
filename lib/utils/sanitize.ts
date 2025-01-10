import sanitizeHtml from "sanitize-html"

export function sanitizeContent(content: string) {
  return sanitizeHtml(content, {
    allowedTags: [
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
    allowedAttributes: {
      a: ["href", "target"]
    }
  })
}
