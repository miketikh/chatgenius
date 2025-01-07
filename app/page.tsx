"use server"

import { Button } from "@/components/ui/button"
import { SignInButton, SignUpButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const { userId } = await auth()

  if (userId) {
    redirect("/chat")
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-4xl font-bold">Welcome to ChatGenius</h1>
      <p className="text-muted-foreground text-lg">
        A Slack-like chat application
      </p>

      <div className="mt-8 flex gap-4">
        <SignInButton mode="modal">
          <Button variant="default">Sign In</Button>
        </SignInButton>

        <SignUpButton mode="modal">
          <Button variant="outline">Sign Up</Button>
        </SignUpButton>
      </div>
    </div>
  )
}
