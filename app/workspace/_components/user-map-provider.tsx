"use client"

import { getUsersByIdsAction } from "@/actions/db/users-actions"
import { SelectDirectMessage, SelectMessage, SelectUser } from "@/db/schema"
import { createContext, useContext, useState } from "react"

/**
 * Helper to transform an incoming message's date fields from string to Date objects.
 */
export function transformMessage<
  T extends {
    createdAt?: string | Date
    updatedAt?: string | Date
    reactions?: any
  }
>(message: T): T {
  const cloned = { ...message }
  if (typeof cloned.createdAt === "string") {
    cloned.createdAt = new Date(cloned.createdAt + "Z")
  }
  if (typeof cloned.updatedAt === "string") {
    cloned.updatedAt = new Date(cloned.updatedAt + "Z")
  }
  // Ensure reactions object is preserved
  if (message.reactions) {
    cloned.reactions = { ...message.reactions }
  }
  return cloned
}

/**
 * Types
 */
export type BulkLoadUsersFn = (
  msgs: (SelectMessage | SelectDirectMessage)[]
) => Promise<void>

interface UserMapContextValue {
  userMap: Record<string, SelectUser>
  bulkLoadUsers: BulkLoadUsersFn
}

/**
 * Context
 */
const UserMapContext = createContext<UserMapContextValue | null>(null)

/**
 * Hook to use userMap context
 */
export function useUserMap() {
  const context = useContext(UserMapContext)
  if (!context) {
    throw new Error("useUserMap must be used within a UserMapProvider")
  }
  return context
}

interface UserMapProviderProps {
  /**
   * Optionally pass in a pre-loaded user map if we already have it
   * (e.g. from server or other sources).
   */
  initialUserMap?: Record<string, SelectUser>
  children: React.ReactNode
}

/**
 * UserMapProvider that caches user data.
 */
export function UserMapProvider({
  initialUserMap = {},
  children
}: UserMapProviderProps) {
  const [userMap, setUserMap] =
    useState<Record<string, SelectUser>>(initialUserMap)

  /**
   * Reusable function to load missing users for messages in bulk
   */
  async function bulkLoadUsers(msgs: (SelectMessage | SelectDirectMessage)[]) {
    const uniqueIds = Array.from(
      new Set(msgs.map(m => ("userId" in m ? m.userId : m.senderId)))
    )
    const missingIds = uniqueIds.filter(id => !userMap[id])
    if (missingIds.length === 0) return

    const res = await getUsersByIdsAction(missingIds)
    if (res.isSuccess) {
      const fetchedUsers = res.data
      const updateMap = { ...userMap }
      fetchedUsers.forEach(u => {
        updateMap[u.id] = u
      })
      setUserMap(updateMap)
    }
  }

  const value: UserMapContextValue = {
    userMap,
    bulkLoadUsers
  }

  return (
    <UserMapContext.Provider value={value}>{children}</UserMapContext.Provider>
  )
}
