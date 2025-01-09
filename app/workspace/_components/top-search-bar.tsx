"use client"

import { searchMessagesAction } from "@/actions/search-actions"
import { Input } from "@/components/ui/input"
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import { format } from "date-fns"
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MessageSquare,
  Search
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"

interface TopSearchBarProps {
  userId: string
  workspaceId?: string
}

interface SearchResult {
  id: string
  content: string
  createdAt: string
  username?: string
  senderUsername?: string
  channelId?: string
  channelName?: string
  chatId?: string
}

export function TopSearchBar({ userId, workspaceId }: TopSearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchRef = useRef<HTMLDivElement>(null)

  let currentChannelId: string | null = null
  let currentChannelName: string | null = null
  let currentChatId: string | null = null

  if (pathname?.includes("/channel/")) {
    const parts = pathname.split("/channel/")[1]?.split("/")
    currentChannelId = parts?.[0] || null
    // Extract channel name from URL if available
    currentChannelName = decodeURIComponent(parts?.[1] || "") || null
  } else if (pathname?.includes("/dm/")) {
    currentChatId = pathname.split("/dm/")[1]?.split("/")[0] || null
  }

  let effectiveWorkspaceId = workspaceId
  if (!effectiveWorkspaceId && pathname?.includes("/workspace/")) {
    effectiveWorkspaceId = pathname.split("/workspace/")[1]?.split("/")[0] || ""
  }

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    channelMessages: SearchResult[]
    directMessages: SearchResult[]
    channelOnlyMessages: SearchResult[]
  }>({ channelMessages: [], directMessages: [], channelOnlyMessages: [] })

  const [isPending, startTransition] = useTransition()
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    setResults({
      channelMessages: [],
      directMessages: [],
      channelOnlyMessages: []
    })
    setShowDropdown(false)
    setQuery("")
  }, [pathname])

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  function transformSearchResult(
    msg: any,
    type: "channel" | "direct"
  ): SearchResult {
    return {
      id: msg.id,
      content: msg.content,
      createdAt: msg.createdAt,
      username: type === "channel" ? msg.username : msg.senderUsername,
      channelId: msg.channelId,
      channelName: msg.channelName,
      chatId: msg.chatId
    }
  }

  async function handleSearch(partialQuery: string) {
    // Only search if query has 2 or more characters
    if (
      !partialQuery.trim() ||
      partialQuery.length < 2 ||
      !effectiveWorkspaceId
    ) {
      setResults({
        channelMessages: [],
        directMessages: [],
        channelOnlyMessages: []
      })
      setShowDropdown(false)
      return
    }

    startTransition(async () => {
      // If in a DM, only search DMs
      if (currentChatId) {
        const res = await searchMessagesAction(partialQuery, userId, {
          workspaceId: effectiveWorkspaceId,
          type: "direct",
          chatId: currentChatId
        })
        if (res.isSuccess) {
          setResults({
            channelMessages: [],
            directMessages: (res.data.directMessages || []).map(msg =>
              transformSearchResult(msg, "direct")
            ),
            channelOnlyMessages: []
          })
        }
      }
      // If in a channel, search current channel and all DMs
      else if (currentChannelId) {
        const [channelRes, dmRes] = await Promise.all([
          searchMessagesAction(partialQuery, userId, {
            workspaceId: effectiveWorkspaceId,
            type: "channel",
            channelId: currentChannelId
          }),
          searchMessagesAction(partialQuery, userId, {
            workspaceId: effectiveWorkspaceId,
            type: "direct"
          })
        ])

        setResults({
          channelMessages: [],
          directMessages: dmRes.isSuccess
            ? (dmRes.data.directMessages || []).map(msg =>
                transformSearchResult(msg, "direct")
              )
            : [],
          channelOnlyMessages: channelRes.isSuccess
            ? (channelRes.data.channelMessages || []).map(msg =>
                transformSearchResult(msg, "channel")
              )
            : []
        })
      }
      // If not in a channel or DM, only search DMs
      else {
        const res = await searchMessagesAction(partialQuery, userId, {
          workspaceId: effectiveWorkspaceId,
          type: "direct"
        })
        if (res.isSuccess) {
          setResults({
            channelMessages: [],
            directMessages: (res.data.directMessages || []).map(msg =>
              transformSearchResult(msg, "direct")
            ),
            channelOnlyMessages: []
          })
        }
      }
      setShowDropdown(true)
    })
  }

  function onChangeQuery(newVal: string) {
    setQuery(newVal)
    handleSearch(newVal)
  }

  function onEnterSearch() {
    if (!effectiveWorkspaceId || !query.trim()) return
    router.push(
      `/workspace/${effectiveWorkspaceId}/search?query=${encodeURIComponent(query)}`
    )
    setShowDropdown(false)
  }

  function formatMessagePreview(message: SearchResult) {
    const date = new Date(message.createdAt)
    const formattedDate = format(date, "MMM d")
    const formattedTime = format(date, "h:mm a")

    return (
      <div className="flex flex-col gap-1 rounded-md p-2 hover:bg-white/10">
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span className="font-medium text-white">
            {message.username || message.senderUsername}
          </span>
          <span>{formattedDate}</span>
          <span>{formattedTime}</span>
          {message.channelName && (
            <>
              <span>in</span>
              <span className="font-medium text-white">
                #{message.channelName}
              </span>
            </>
          )}
        </div>
        <p className="text-sm text-white">{message.content}</p>
      </div>
    )
  }

  return (
    <div className="flex w-full items-center gap-4 text-white">
      <div className="flex items-center gap-2">
        <button
          className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-4 text-white" />
        </button>
        <button
          className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.forward()}
        >
          <ArrowRight className="size-4 text-white" />
        </button>
        <button
          className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-white/20"
          onClick={() => router.push("/workspace")}
        >
          <Clock className="size-4 text-white" />
        </button>
      </div>

      <div ref={searchRef} className="relative flex max-w-[600px] flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="size-4 text-white/60" />
        </div>
        <Input
          className="border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/60 focus-visible:ring-white/30"
          placeholder="Search messages (2+ characters)..."
          value={query}
          onChange={e => onChangeQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault()
              onEnterSearch()
            }
          }}
        />

        {showDropdown &&
          (results.channelOnlyMessages.length > 0 ||
            results.directMessages.length > 0) && (
            <div className="absolute top-full z-50 mt-1 max-h-[500px] w-full overflow-auto rounded-md border border-white/20 bg-black/95 p-4 shadow-lg">
              {currentChannelId && results.channelOnlyMessages.length > 0 && (
                <div className="mb-6 space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-white/60">
                    Results from #{currentChannelName}
                  </div>
                  {results.channelOnlyMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="cursor-pointer"
                      onClick={() => {
                        router.push(
                          `/workspace/${effectiveWorkspaceId}/channel/${currentChannelId}`
                        )
                        setShowDropdown(false)
                      }}
                    >
                      {formatMessagePreview(msg)}
                    </div>
                  ))}
                </div>
              )}

              {results.directMessages.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-medium uppercase tracking-wider text-white/60">
                    Direct Messages
                  </div>
                  {results.directMessages.map(msg => (
                    <div
                      key={msg.id}
                      className="cursor-pointer"
                      onClick={() => {
                        if (msg.chatId) {
                          router.push(
                            `/workspace/${effectiveWorkspaceId}/dm/${msg.chatId}`
                          )
                        }
                        setShowDropdown(false)
                      }}
                    >
                      {formatMessagePreview(msg)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-5 text-white" />
          <span className="font-semibold text-white">ChatGenius</span>
        </div>
        <ThemeSwitcher />
      </div>
    </div>
  )
}
