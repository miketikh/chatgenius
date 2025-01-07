"use server"

import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function ChatPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/")
  }

  return (
    <div className="flex h-full flex-col items-center justify-center">
      <h1 className="text-2xl font-semibold">Welcome to ChatGenius</h1>
      <p className="text-muted-foreground mt-2">
        Select a channel or start a direct message to begin chatting
      </p>
    </div>
  )
}
