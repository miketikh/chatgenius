"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SelectPresence, SelectUser } from "@/db/schema"
import { usePresence } from "@/lib/hooks/use-presence"
import { cn } from "@/lib/utils"
import { User } from "lucide-react"

interface UserAvatarProps {
  user?: SelectUser
  className?: string
  fallback?: string
  showStatus?: boolean
  size?: "sm" | "md" | "lg"
}

const sizeClasses = {
  sm: "size-6",
  md: "size-8",
  lg: "size-10"
}

const statusSizeClasses = {
  sm: "size-2",
  md: "size-3",
  lg: "size-3.5"
}

export function UserAvatar({
  user,
  className,
  fallback,
  showStatus = true,
  size = "md"
}: UserAvatarProps) {
  const { presenceMap } = usePresence()
  const userPresence = user ? presenceMap[user.id] : undefined

  const statusColors: Record<SelectPresence["status"], string> = {
    online: "bg-green-500",
    offline: "bg-gray-500",
    away: "bg-yellow-500"
  }

  return (
    <div className={cn("relative", className)}>
      <Avatar className={sizeClasses[size]}>
        <AvatarImage src={user?.imageUrl || undefined} />
        <AvatarFallback>
          {fallback ? (
            fallback
          ) : user?.fullName ? (
            user.fullName[0].toUpperCase()
          ) : user?.username ? (
            user.username[0].toUpperCase()
          ) : (
            <User className="size-4" />
          )}
        </AvatarFallback>
      </Avatar>

      {showStatus && user && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2",
            size === "sm" ? "border-background" : "border-blue-900",
            statusSizeClasses[size],
            statusColors[userPresence?.status || "offline"]
          )}
        />
      )}
    </div>
  )
}
