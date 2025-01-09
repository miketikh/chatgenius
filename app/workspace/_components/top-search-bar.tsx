"use client"

import { searchMessagesAction } from "@/actions/search-actions"
import { Input } from "@/components/ui/input"
import { ThemeSwitcher } from "@/components/utilities/theme-switcher"
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  MessageSquare,
  Search
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

interface TopSearchBarProps {
  userId: string
  workspaceId?: string
}

/**
 * Enhanced TopSearchBar that:
 * - Extracts the channelId or dmId from the current URL (if any).
 * - Provides real-time "channel-only" and "workspace-wide" message results in a dropdown.
 * - On Enter, navigates to /workspace/[workspaceId]/search?query=&lt;...&gt; (workspace-wide).
 */
export function TopSearchBar({ userId, workspaceId }: TopSearchBarProps) {
  const router = useRouter()
  const pathname = usePathname()

  // We'll parse channel/dm from the URL
  // e.g. /workspace/&lt;ws&gt;/channel/&lt;channelId&gt;
  // e.g. /workspace/&lt;ws&gt;/dm/&lt;chatId&gt;
  let currentChannelId: string | null = null
  let currentChatId: string | null = null

  if (pathname?.includes("/channel/")) {
    currentChannelId = pathname.split("/channel/")[1]?.split("/")[0] || null
  } else if (pathname?.includes("/dm/")) {
    currentChatId = pathname.split("/dm/")[1]?.split("/")[0] || null
  }

  // Make sure we have a workspaceId if not passed in props
  // We parse from the URL /workspace/&lt;id&gt;/...
  let effectiveWorkspaceId = workspaceId
  if (!effectiveWorkspaceId && pathname?.includes("/workspace/")) {
    effectiveWorkspaceId = pathname.split("/workspace/")[1]?.split("/")[0] || ""
  }

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{
    channelMessages: any[]
    directMessages: any[]
    channelOnlyMessages: any[]
  }>({ channelMessages: [], directMessages: [], channelOnlyMessages: [] })

  const [isPending, startTransition] = useTransition()
  const [showDropdown, setShowDropdown] = useState(false)

  // If the user changes channels or workspace, reset local states
  useEffect(() => {
    setResults({
      channelMessages: [],
      directMessages: [],
      channelOnlyMessages: []
    })
    setShowDropdown(false)
    setQuery("")
  }, [pathname])

  /**
   * Search within workspace + optionally limit to channel if present
   * We'll call the same action with different filters to simulate Slack-like suggestions.
   */
  async function handleSearch(partialQuery: string) {
    if (!partialQuery.trim() || !effectiveWorkspaceId) {
      setResults({
        channelMessages: [],
        directMessages: [],
        channelOnlyMessages: []
      })
      return
    }

    startTransition(async () => {
      // 1) Search entire workspace
      const res = await searchMessagesAction(partialQuery, userId, {
        workspaceId: effectiveWorkspaceId
      })
      // 2) Search only in the current channel if channelId is present
      let channelRes: any = { isSuccess: false, data: { channelMessages: [] } }
      if (currentChannelId) {
        channelRes = await searchMessagesAction(partialQuery, userId, {
          workspaceId: effectiveWorkspaceId,
          channelId: currentChannelId
        })
      }

      if (res.isSuccess) {
        setResults({
          channelMessages: res.data.channelMessages || [],
          directMessages: res.data.directMessages || [],
          channelOnlyMessages: channelRes.isSuccess
            ? channelRes.data.channelMessages || []
            : []
        })
      }
      setShowDropdown(true)
    })
  }

  // Called when user types in the search box
  function onChangeQuery(newVal: string) {
    setQuery(newVal)
    // We do a "live" search as they type
    handleSearch(newVal)
  }

  // Called when user presses Enter
  function onEnterSearch() {
    if (!effectiveWorkspaceId || !query.trim()) return
    // We'll navigate to a new route: /workspace/&lt;workspaceId&gt;/search?query=&lt;query&gt;
    router.push(
      `/workspace/${effectiveWorkspaceId}/search?query=${encodeURIComponent(query)}`
    )
    setShowDropdown(false)
  }

  return (
    <div className="flex w-full items-center gap-4 text-white">
      {/* History Navigation */}
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

      {/* Search */}
      <div className="relative flex max-w-[600px] flex-1">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <Search className="size-4 text-white/60" />
        </div>
        <Input
          className="border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/60 focus-visible:ring-white/30"
          placeholder="Search messages..."
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
          (results.channelMessages.length > 0 ||
            results.directMessages.length > 0 ||
            results.channelOnlyMessages.length > 0) && (
            <div className="absolute top-full z-50 mt-1 max-h-[500px] w-full overflow-auto rounded-md border border-white/20 bg-black/95 p-2 shadow-lg">
              <h4 className="mb-2 font-bold text-white">Search Suggestions</h4>

              {/* If there's a channel, show 'channel only' results */}
              {currentChannelId && (
                <div className="mb-4 space-y-1">
                  <div className="text-sm font-semibold text-white/70">
                    In this channel
                  </div>
                  {results.channelOnlyMessages.length === 0 && (
                    <div className="p-2 text-sm text-white/60">
                      No channel-specific matches yet
                    </div>
                  )}
                  {results.channelOnlyMessages.slice(0, 5).map(msg => (
                    <div
                      key={msg.id}
                      className="cursor-pointer rounded-md p-2 text-sm text-white hover:bg-white/10"
                      onClick={() => {
                        router.push(
                          `/workspace/${effectiveWorkspaceId}/channel/${currentChannelId}`
                        )
                        setShowDropdown(false)
                      }}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
              )}

              {/* Full workspace results */}
              <div className="mb-4 space-y-1">
                <div className="text-sm font-semibold text-white/70">
                  All Channels
                </div>
                {results.channelMessages.slice(0, 5).map(msg => (
                  <div
                    key={msg.id}
                    className="cursor-pointer rounded-md p-2 text-sm text-white hover:bg-white/10"
                    onClick={() => {
                      if (msg.channelId) {
                        router.push(
                          `/workspace/${effectiveWorkspaceId}/channel/${msg.channelId}`
                        )
                      }
                      setShowDropdown(false)
                    }}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>

              {/* DM results */}
              <div className="space-y-1">
                <div className="text-sm font-semibold text-white/70">
                  Direct Messages
                </div>
                {results.directMessages.slice(0, 5).map(msg => (
                  <div
                    key={msg.id}
                    className="cursor-pointer rounded-md p-2 text-sm text-white hover:bg-white/10"
                    onClick={() => {
                      if (msg.chatId) {
                        router.push(
                          `/workspace/${effectiveWorkspaceId}/dm/${msg.chatId}`
                        )
                      }
                      setShowDropdown(false)
                    }}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>

      {/* Logo and Theme Switcher */}
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
