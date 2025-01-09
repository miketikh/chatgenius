"use server"

import { getChannelAction } from "@/actions/db/channels-actions"
import { MessageInput } from "@/app/workspace/_components/message-input"
import { MessageList } from "@/app/workspace/_components/message-list"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

interface ChannelPageProps {
  params: {
    workspaceId: string
    channelId: string
  }
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/")
  }

  const { workspaceId, channelId } = params

  const channelRes = await getChannelAction(channelId)
  if (!channelRes.isSuccess) {
    redirect(`/workspace/${workspaceId}`)
  }

  // Make sure channel's workspaceId matches
  if (channelRes.data.workspaceId !== workspaceId) {
    redirect(`/workspace/${workspaceId}`)
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
