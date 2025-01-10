"use client"

import { getPresencesAction } from "@/actions/db/presence-actions"
import { SelectPresence } from "@/db/schema"
import { createClient } from "@supabase/supabase-js"
import React, { useContext, useEffect, useMemo, useState } from "react"

// Adjust these ENV calls or config as needed; they may already exist in your code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface PresenceContextValue {
  presenceMap: Record<string, SelectPresence>
}

const PresenceContext = React.createContext<PresenceContextValue>({
  presenceMap: {}
})

export function usePresence() {
  return useContext(PresenceContext)
}

interface PresenceProviderProps {
  userIds: string[]
  children: React.ReactNode
}

/**
 * PresenceProvider handles subscribing to real-time updates for the `presence`
 * table and exposing a presenceMap to descendants via context.
 *
 * Only userIds relevant to the workspace should be passed in.
 */
export function PresenceProvider({ userIds, children }: PresenceProviderProps) {
  const [presenceMap, setPresenceMap] = useState<
    Record<string, SelectPresence>
  >({})

  useEffect(() => {
    if (userIds.length === 0) return

    const channel = supabase
      .channel("workspace-presence")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "presence"
        },
        payload => {
          const row = payload.new as SelectPresence
          if (row && userIds.includes(row.userId)) {
            setPresenceMap(prev => ({
              ...prev,
              [row.userId]: row
            }))
          }
        }
      )
      .subscribe()

    // Load initial presence from server so we don't wait for the first update
    loadInitialPresence(userIds).catch(err =>
      console.error("Error loading presence:", err)
    )

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userIds])

  async function loadInitialPresence(ids: string[]) {
    if (ids.length === 0) return

    const res = await getPresencesAction(ids)
    if (res.isSuccess && res.data) {
      const nextMap: Record<string, SelectPresence> = {}
      res.data.forEach(presence => {
        nextMap[presence.userId] = presence
      })
      setPresenceMap(nextMap)
    }
  }

  const contextValue = useMemo(() => ({ presenceMap }), [presenceMap])

  return (
    <PresenceContext.Provider value={contextValue}>
      {children}
    </PresenceContext.Provider>
  )
}
