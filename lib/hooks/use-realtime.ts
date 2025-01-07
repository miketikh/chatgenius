"use client"

import { supabase } from "@/lib/supabase"
import { useEffect } from "react"

// Optional snake->camel helper; remove if you prefer handling transforms elsewhere
function snakeToCamel<T>(obj: any): T {
  const camelObj: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) =>
        letter.toUpperCase()
      )
      camelObj[camelKey] = obj[key]
    }
  }
  return camelObj as T
}

interface UseRealtimeTableOptions<T> {
  table: string
  filter: string
  onInsert?: (record: T) => void
  onUpdate?: (record: T) => void
  onDelete?: (record: T) => void
}

export function useRealtimeTable<T>({
  table,
  filter,
  onInsert,
  onUpdate,
  onDelete
}: UseRealtimeTableOptions<T>) {
  useEffect(() => {
    if (!filter) return

    const channel = supabase
      .channel(table)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        payload => {
          const { eventType, new: newRecord, old: oldRecord } = payload
          switch (eventType) {
            case "INSERT":
              if (onInsert) onInsert(snakeToCamel<T>(newRecord))
              break
            case "UPDATE":
              if (onUpdate) onUpdate(snakeToCamel<T>(newRecord))
              break
            case "DELETE":
              if (onDelete) onDelete(snakeToCamel<T>(oldRecord))
              break
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, onInsert, onUpdate, onDelete])
}
