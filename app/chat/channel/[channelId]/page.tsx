"use server"

import { getChannelAction } from "@/actions/db/channels-actions"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { MessageInput } from "../../_components/message-input"
import { MessageList } from "../../_components/message-list"

interface ChannelPageProps {
  params: Promise<{
    channelId: string
  }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { userId } = await auth()
  const { channelId } = await params

  if (!userId) {
    redirect("/")
  }

  const channelRes = await getChannelAction(channelId)
  if (!channelRes.isSuccess) {
    redirect("/chat")
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex min-h-12 items-center border-b px-4">
        <h1 className="text-lg font-semibold">#{channelRes.data.name}</h1>
      </div>

      <MessageList type="channel" channelId={channelId} userId={userId} />

      <MessageInput type="channel" channelId={channelId} userId={userId} />
    </div>
  )
}
