"use client"

import {
  SelectChannel,
  SelectDirectChat,
  SelectDirectMessage,
  SelectMessage
} from "@/db/schema"
import { supabase } from "@/lib/supabase"
import { useEffect } from "react"

type DirectMessageWithUsername = SelectDirectMessage & { senderUsername: string }

function snakeToCamel<T>(obj: any): T {
  const camelObj: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      camelObj[camelKey] = obj[key]
    }
  }
  return camelObj as T
}

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

        switch (eventType) {
          case "INSERT":
            console.log("new message", newRecord)
            onNewMessage(snakeToCamel<SelectMessage>(newRecord))
            break
          case "UPDATE":
            console.log("update message", newRecord)
            onUpdateMessage(snakeToCamel<SelectMessage>(newRecord))
            break
          case "DELETE":
            console.log("delete message", oldRecord)
            onDeleteMessage(snakeToCamel<SelectMessage>(oldRecord))
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
  onNewMessage: (message: DirectMessageWithUsername) => void,
  onUpdateMessage: (message: DirectMessageWithUsername) => void,
  onDeleteMessage: (message: DirectMessageWithUsername) => void
) {
  useEffect(() => {
    if (!chatId) return

    const fetchUsername = async (userId: string) => {
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("id", userId)
        .single()
      return data?.username
    }

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
        async (payload) => {
          const message = snakeToCamel<SelectDirectMessage>(payload.new)
          const username = await fetchUsername(message.senderId)
          onNewMessage({ ...message, senderUsername: username || "" })
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
        async (payload) => {
          const message = snakeToCamel<SelectDirectMessage>(payload.new)
          const username = await fetchUsername(message.senderId)
          onUpdateMessage({ ...message, senderUsername: username || "" })
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
        async (payload) => {
          const message = snakeToCamel<SelectDirectMessage>(payload.old)
          const username = await fetchUsername(message.senderId)
          onDeleteMessage({ ...message, senderUsername: username || "" })
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
          onNewChannel(snakeToCamel<SelectChannel>(payload.new))
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
          onUpdateChannel(snakeToCamel<SelectChannel>(payload.new))
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
          onDeleteChannel(snakeToCamel<SelectChannel>(payload.old))
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
          onNewChat(snakeToCamel<SelectDirectChat>(payload.new))
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
          onUpdateChat(snakeToCamel<SelectDirectChat>(payload.new))
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
          onDeleteChat(snakeToCamel<SelectDirectChat>(payload.old))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [onNewChat, onUpdateChat, onDeleteChat])
}
