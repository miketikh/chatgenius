"use server"

import { getUserAction } from "@/actions/db/users-actions"
import { MessageInput } from "@/app/workspace/_components/message-input"
import { MessageList } from "@/app/workspace/_components/message-list"
import { db } from "@/db/db"
import { directChatsTable } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { and, eq } from "drizzle-orm"
import { redirect } from "next/navigation"

interface DirectMessagePageProps {
  params: {
    workspaceId: string
    chatId: string
  }
}

export default async function DirectMessagePage({
  params
}: DirectMessagePageProps) {
  const { userId } = await auth()
  if (!userId) redirect("/")

  const { workspaceId, chatId } = params

  // Make sure DM belongs to this workspace
  const chat = await db.query.directChats.findFirst({
    where: and(
      eq(directChatsTable.id, chatId),
      eq(directChatsTable.workspaceId, workspaceId)
    )
  })

  if (!chat) {
    redirect(`/workspace/${workspaceId}`)
  }

  const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id
  const otherUserRes = await getUserAction(otherUserId)
  if (!otherUserRes.isSuccess) {
    redirect(`/workspace/${workspaceId}`)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-12 items-center border-b px-4">
        <div className="flex items-center">
          <div className="bg-primary/10 size-8 rounded-full" />
          <div className="ml-2">
            <h1 className="text-lg font-semibold">
              {otherUserRes.data.fullName || otherUserRes.data.username}
            </h1>
            {otherUserRes.data.fullName && (
              <p className="text-muted-foreground text-sm">
                @{otherUserRes.data.username}
              </p>
            )}
          </div>
        </div>
      </div>

      <MessageList type="direct" chatId={chatId} userId={userId} />
      <MessageInput type="direct" chatId={chatId} userId={userId} />
    </div>
  )
}
