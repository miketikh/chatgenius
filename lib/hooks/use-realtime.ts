"use client"

import {
  SelectChannel,
  SelectDirectChat,
  SelectDirectMessage,
  SelectMessage
} from "@/db/schema"
import { supabase } from "@/lib/supabase"
import { useEffect } from "react"

export function useRealtimeMessages(
  channelId: string,
  onNewMessage: (message: SelectMessage) => void,
  onUpdateMessage: (message: SelectMessage) => void,
  onDeleteMessage: (message: SelectMessage) => void
) {
  useEffect(() => {
    if (!channelId) return
    console.log("subscribing to messages")

    const channel = supabase.channel("messages").on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages",
        filter: `channel_id=eq.${channelId}`
      },
      payload => {
        console.log("postgres change received:", payload)
        const { eventType, new: newRecord, old: oldRecord } = payload

        // Normalize dates to ISO strings
        const normalizeRecord = (record: any) => ({
          ...record,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        })

        switch (eventType) {
          case "INSERT":
            console.log("new message", newRecord)
            onNewMessage(normalizeRecord(newRecord) as SelectMessage)
            break
          case "UPDATE":
            console.log("update message", newRecord)
            onUpdateMessage(normalizeRecord(newRecord) as SelectMessage)
            break
          case "DELETE":
            console.log("delete message", oldRecord)
            onDeleteMessage(normalizeRecord(oldRecord) as SelectMessage)
            break
        }
      }
    )

    console.log("subscribing to channel:", "messages")
    channel.subscribe(status => {
      console.log("subscription status:", status)
    })

    return () => {
      console.log("cleaning up subscription for channel:", "messages")
      supabase.removeChannel(channel)
    }
  }, [channelId, onNewMessage, onUpdateMessage, onDeleteMessage])
}

export function useRealtimeDirectMessages(
  chatId: string,
  onNewMessage: (message: SelectDirectMessage) => void,
  onUpdateMessage: (message: SelectDirectMessage) => void,
  onDeleteMessage: (message: SelectDirectMessage) => void
) {
  useEffect(() => {
    if (!chatId) return

    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
          filter: `chat_id=eq.${chatId}`
        },
        payload => {
          onNewMessage(payload.new as SelectDirectMessage)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_messages",
          filter: `chat_id=eq.${chatId}`
        },
        payload => {
          onUpdateMessage(payload.new as SelectDirectMessage)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "direct_messages",
          filter: `chat_id=eq.${chatId}`
        },
        payload => {
          onDeleteMessage(payload.old as SelectDirectMessage)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatId, onNewMessage, onUpdateMessage, onDeleteMessage])
}

export function useRealtimeChannels(
  onNewChannel: (channel: SelectChannel) => void,
  onUpdateChannel: (channel: SelectChannel) => void,
  onDeleteChannel: (channel: SelectChannel) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel("channels")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channels"
        },
        payload => {
          onNewChannel(payload.new as SelectChannel)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "channels"
        },
        payload => {
          onUpdateChannel(payload.new as SelectChannel)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "channels"
        },
        payload => {
          onDeleteChannel(payload.old as SelectChannel)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onNewChannel, onUpdateChannel, onDeleteChannel])
}

export function useRealtimeDirectChats(
  onNewChat: (chat: SelectDirectChat) => void,
  onUpdateChat: (chat: SelectDirectChat) => void,
  onDeleteChat: (chat: SelectDirectChat) => void
) {
  useEffect(() => {
    const channel = supabase
      .channel("direct_chats")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_chats"
        },
        payload => {
          onNewChat(payload.new as SelectDirectChat)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "direct_chats"
        },
        payload => {
          onUpdateChat(payload.new as SelectDirectChat)
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "direct_chats"
        },
        payload => {
          onDeleteChat(payload.old as SelectDirectChat)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onNewChat, onUpdateChat, onDeleteChat])
}
