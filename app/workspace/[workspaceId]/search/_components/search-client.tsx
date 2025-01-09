"use client"

import { searchMessagesAction } from "@/actions/search-actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SelectDirectMessage, SelectMessage } from "@/db/schema"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

interface SearchClientProps {
  workspaceId: string
  userId: string
}

interface SearchResult {
  channelMessages: (SelectMessage & { username: string; channelName: string })[]
  directMessages: (SelectDirectMessage & { senderUsername: string })[]
}

export default function SearchClient({
  workspaceId,
  userId
}: SearchClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("query") || ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult>({
    channelMessages: [],
    directMessages: []
  })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (query.trim() && userId) {
      doSearch(query)
    } else {
      setResults({ channelMessages: [], directMessages: [] })
    }
  }, [query, userId])

  async function doSearch(q: string) {
    startTransition(async () => {
      const res = await searchMessagesAction(q, userId, { workspaceId })
      if (res.isSuccess) {
        setResults(res.data)
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    router.push(
      `/workspace/${workspaceId}/search?query=${encodeURIComponent(query)}`
    )
  }

  function formatMessagePreview(
    message:
      | (SelectMessage & { username: string; channelName: string })
      | (SelectDirectMessage & { senderUsername: string }),
    type: "channel" | "direct"
  ) {
    const date = new Date(message.createdAt)
    const formattedDate = format(date, "MMM d")
    const formattedTime = format(date, "h:mm a")
    const username =
      type === "channel"
        ? (message as any).username
        : (message as any).senderUsername

    return (
      <div className="flex flex-col gap-2 rounded-lg border border-white/20 bg-black/95 p-4 transition-colors hover:bg-white/10">
        {type === "channel" && (
          <div className="text-sm font-medium text-white/60">
            #{(message as any).channelName}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarImage
              src={`https://avatar.vercel.sh/${username}.png`}
              alt={username}
            />
            <AvatarFallback>{username[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span className="font-medium text-white">{username}</span>
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
          </div>
        </div>

        <p className="text-sm text-white">{message.content}</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold text-white">Search Results</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/30"
            placeholder="Search messages..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button
            type="submit"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Search
          </Button>
        </div>
      </form>

      {isPending ? (
        <div className="py-8 text-center text-sm text-white/60">
          Searching...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Channel Messages */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Channel Messages
            </h2>
            {results.channelMessages.length === 0 ? (
              <div className="py-4 text-center text-sm text-white/60">
                No channel messages found
              </div>
            ) : (
              <div className="space-y-2">
                {results.channelMessages.map(msg => (
                  <Link
                    key={msg.id}
                    href={`/workspace/${workspaceId}/channel/${msg.channelId}`}
                  >
                    {formatMessagePreview(msg, "channel")}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-white">
              Direct Messages
            </h2>
            {results.directMessages.length === 0 ? (
              <div className="py-4 text-center text-sm text-white/60">
                No direct messages found
              </div>
            ) : (
              <div className="space-y-2">
                {results.directMessages.map(msg => (
                  <Link
                    key={msg.id}
                    href={`/workspace/${workspaceId}/dm/${msg.chatId}`}
                  >
                    {formatMessagePreview(msg, "direct")}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
