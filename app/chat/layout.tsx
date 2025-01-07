"use server"

import { createUserAction, getUserAction } from "@/actions/db/users-actions"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "./_components/sidebar"

export default async function ChatLayout({
  children
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/")
  }

  // Get the user record from our database
  const userResult = await getUserAction(userId)

  // If user doesn't exist in our database, create them
  if (!userResult.isSuccess) {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      redirect("/")
    }

    await createUserAction({
      id: userId,
      username: clerkUser.username || "",
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      fullName:
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      imageUrl: clerkUser.imageUrl,
      status: "offline"
    })
  }

  return (
    <div className="flex h-screen">
      <Sidebar userId={userId} />
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
