"use client"

import { searchMessagesAction } from "@/actions/search-actions"
import { Input } from "@/components/ui/input"
import { ArrowLeft, ArrowRight, Clock, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"

interface TopSearchBarProps {
  userId: string
  workspaceId?: string // NEW
}

export function TopSearchBar({ userId, workspaceId }: TopSearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    channelMessages: any[]
    directMessages: any[]
  }>({ channelMessages: [], directMessages: [] })

  const [isPending, startTransition] = useTransition()

  async function handleSearch() {
    if (!query.trim()) return
    startTransition(async () => {
      // Modify your search to pass workspaceId so you only search inside that workspace
      const res = await searchMessagesAction(query, userId, workspaceId)
      if (res.isSuccess) {
        setResults(res.data)
      }
    })
  }

  return (
    <div className="flex w-full items-center gap-4">
      {/* History Navigation */}
      <div className="flex items-center gap-2">
        <button
          className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.forward()}
        >
          <ArrowRight className="size-4" />
        </button>
        <button
          className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.push("/workspace")}
        >
          <Clock className="size-4" />
        </button>
      </div>

      {/* Search */}
      <div className="relative flex max-w-[600px] flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="size-4 text-white/60" />
        </div>
        <Input
          className="border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/60 focus-visible:ring-white/30"
          placeholder="Search messages..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              handleSearch()
            }
          }}
        />

        {(results.channelMessages.length > 0 ||
          results.directMessages.length > 0) && (
          <div className="absolute top-full z-50 mt-1 max-h-[500px] w-full overflow-auto rounded-md border border-blue-700 bg-blue-900/95 p-2 shadow-lg">
            <h4 className="mb-2 font-bold">Search Results</h4>
            <div className="space-y-1">
              {results.channelMessages.map(msg => (
                <div
                  key={msg.id}
                  className="rounded-md p-2 text-sm hover:bg-white/10"
                >
                  Channel msg: {msg.content}
                </div>
              ))}
              {results.directMessages.map(msg => (
                <div
                  key={msg.id}
                  className="rounded-md p-2 text-sm hover:bg-white/10"
                >
                  DM: {msg.content}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
