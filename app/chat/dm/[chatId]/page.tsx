"use server"

import { getUserAction } from "@/actions/db/users-actions"
import { db } from "@/db/db"
import { directChatsTable } from "@/db/schema"
import { auth } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import { MessageInput } from "../../_components/message-input"
import { MessageList } from "../../_components/message-list"

interface DirectMessagePageProps {
  params: Promise<{
    chatId: string
  }>
}

export default async function DirectMessagePage({
  params
}: DirectMessagePageProps) {
  const { userId } = await auth()
  const { chatId } = await params

  if (!userId) {
    redirect("/")
  }

  // Get the chat
  const chat = await db.query.directChats.findFirst({
    where: eq(directChatsTable.id, chatId)
  })

  if (!chat) {
    redirect("/chat")
  }

  // Get the other user's info
  const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id
  const otherUserRes = await getUserAction(otherUserId)

  if (!otherUserRes.isSuccess) {
    redirect("/chat")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-12 items-center border-b px-4">
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
