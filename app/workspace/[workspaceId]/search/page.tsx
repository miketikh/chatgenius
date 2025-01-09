"use client"

import { searchMessagesAction } from "@/actions/search-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { use, useEffect, useState, useTransition } from "react"

interface SearchPageProps {
  params: Promise<{
    workspaceId: string
  }>
}

export default function SearchPage({ params }: SearchPageProps) {
  const { workspaceId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("query") || ""

  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<{
    channelMessages: any[]
    directMessages: any[]
  }>({ channelMessages: [], directMessages: [] })
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (query.trim()) {
      doSearch(query)
    } else {
      setResults({ channelMessages: [], directMessages: [] })
    }
  }, [query])

  async function doSearch(q: string) {
    startTransition(async () => {
      const res = await searchMessagesAction(q, "", { workspaceId })
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

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold">Search Results</h1>
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="Search messages..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <Button type="submit">Search</Button>
        </div>
      </form>

      {isPending ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          Searching...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Channel Messages */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Channel Messages</h2>
            {results.channelMessages.length === 0 ? (
              <div className="text-muted-foreground py-4 text-center text-sm">
                No channel messages found
              </div>
            ) : (
              <div className="space-y-2">
                {results.channelMessages.map(msg => (
                  <Link
                    key={msg.id}
                    href={`/workspace/${workspaceId}/channel/${msg.channelId}`}
                    className="block rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="text-muted-foreground mb-1 text-sm">
                      Channel: {msg.channelId}
                    </div>
                    <div>{msg.content}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Direct Messages */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Direct Messages</h2>
            {results.directMessages.length === 0 ? (
              <div className="text-muted-foreground py-4 text-center text-sm">
                No direct messages found
              </div>
            ) : (
              <div className="space-y-2">
                {results.directMessages.map(msg => (
                  <Link
                    key={msg.id}
                    href={`/workspace/${workspaceId}/dm/${msg.chatId}`}
                    className="block rounded-lg border p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
                  >
                    <div className="text-muted-foreground mb-1 text-sm">
                      Chat: {msg.chatId}
                    </div>
                    <div>{msg.content}</div>
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
