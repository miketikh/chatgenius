"use server"

import { createUserAction, getUserAction } from "@/actions/db/users-actions"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

interface WorkspaceLayoutProps {
  children: React.ReactNode
}

export default async function WorkspaceLayout({
  children
}: WorkspaceLayoutProps) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/")
  }

  // Check if user exists in our database
  const userRes = await getUserAction(userId)

  // If user doesn't exist, create them using Clerk data
  if (!userRes.isSuccess) {
    const clerkUser = await currentUser()
    if (!clerkUser) {
      redirect("/")
    }

    await createUserAction({
      id: userId,
      email: clerkUser.emailAddresses[0]?.emailAddress || "",
      username: clerkUser.username || "",
      fullName:
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
      imageUrl: clerkUser.imageUrl
    })
  }

  return <>{children}</>
}
