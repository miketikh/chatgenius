"use client"

import { SelectDirectMessage, SelectMessage } from "@/db/schema"
import { useState } from "react"
import { MessageInput } from "./message-input"
import { MessageList } from "./message-list"
import { ThreadPanel } from "./thread-panel"
import { useUserMap } from "./user-map-provider"

interface ChannelContentProps {
  type: "channel" | "direct"
  channelId?: string
  chatId?: string
  userId: string
  channelName?: string
}

export function ChannelContent({
  type,
  channelId,
  chatId,
  userId,
  channelName
}: ChannelContentProps) {
  const [selectedMessage, setSelectedMessage] = useState<
    SelectMessage | SelectDirectMessage | null
  >(null)

  const { userMap, bulkLoadUsers } = useUserMap()

  return (
    <div className="flex h-full">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex min-h-12 items-center border-b px-4">
          <h1 className="text-lg font-semibold">
            {type === "channel" ? `#${channelName}` : "Direct Message"}
          </h1>
        </div>

        <MessageList
          type={type}
          channelId={channelId}
          chatId={chatId}
          userId={userId}
          onThreadSelect={setSelectedMessage}
        />

        <MessageInput
          type={type}
          channelId={channelId}
          chatId={chatId}
          userId={userId}
        />
      </div>

      {selectedMessage && (
        <ThreadPanel
          type={type}
          parentMessage={selectedMessage}
          userId={userId}
          onClose={() => setSelectedMessage(null)}
          userMap={userMap}
          bulkLoadUsers={bulkLoadUsers}
        />
      )}
    </div>
  )
}
