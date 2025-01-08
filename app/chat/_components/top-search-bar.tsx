"use client"

import { useState, useTransition } from "react"
import { searchMessagesAction } from "@/actions/search-actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface TopSearchBarProps {
  userId: string
}

export function TopSearchBar({ userId }: TopSearchBarProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    channelMessages: any[]
    directMessages: any[]
  }>({ channelMessages: [], directMessages: [] })

  const [isPending, startTransition] = useTransition()

  async function handleSearch() {
    if (!query.trim()) return
    startTransition(async () => {
      const res = await searchMessagesAction(query, userId)
      if (res.isSuccess) {
        setResults(res.data)
      }
    })
  }

  return (
    <div className="relative flex items-center gap-2 p-2">
      <Input
        placeholder="Search..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <Button onClick={handleSearch} disabled={isPending}>
        Search
      </Button>

      {(results.channelMessages.length > 0 ||
        results.directMessages.length > 0) && (
        <div className="absolute top-10 z-50 max-h-[300px] w-[300px] overflow-auto rounded-md bg-white p-2 shadow">
          <h4 className="font-bold">Search Results</h4>
          <div className="mt-2">
            {results.channelMessages.map(msg => (
              <div key={msg.id} className="border-b py-1 text-sm">
                Channel msg: {msg.content}
              </div>
            ))}
            {results.directMessages.map(msg => (
              <div key={msg.id} className="border-b py-1 text-sm">
                DM: {msg.content}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
