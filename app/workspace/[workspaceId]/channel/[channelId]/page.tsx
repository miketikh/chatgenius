"use server"

import { getChannelAction } from "@/actions/db/channels-actions"
import { ChannelContent } from "@/app/workspace/_components/channel-content"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

interface ChannelPageProps {
  params: Promise<{
    workspaceId: string
    channelId: string
  }>
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/")
  }

  const { workspaceId, channelId } = await Promise.resolve(params)

  const channelRes = await getChannelAction(channelId)
  if (!channelRes.isSuccess) {
    redirect(`/workspace/${workspaceId}`)
  }

  // Make sure channel's workspaceId matches
  if (channelRes.data.workspaceId !== workspaceId) {
    redirect(`/workspace/${workspaceId}`)
  }

  return (
    <ChannelContent
      type="channel"
      channelId={channelId}
      userId={userId}
      channelName={channelRes.data.name}
    />
  )
}
