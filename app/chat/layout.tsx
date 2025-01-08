"use server"

import { createUserAction, getUserAction } from "@/actions/db/users-actions"
import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "./_components/sidebar"
import { TopSearchBar } from "./_components/top-search-bar"
import { WorkspacesSidebar } from "./_components/workspaces-sidebar"

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
      {/* Workspaces sidebar */}
      <div className="flex h-full w-16 border-r border-blue-700 bg-gradient-to-b from-blue-900 to-blue-800">
        <WorkspacesSidebar
          userId={userId}
          userWorkspaces={[]}
          user={userResult.isSuccess ? userResult.data : undefined}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <div className="flex min-h-12 items-center border-b border-blue-700 bg-gradient-to-r from-blue-900 to-blue-800 p-2 text-white">
          <TopSearchBar userId={userId} />
        </div>

        {/* Channels sidebar + content */}
        <div className="flex flex-1">
          <Sidebar userId={userId} />
          <main className="flex-1 overflow-hidden">{children}</main>
        </div>
      </div>
    </div>
  )
}
