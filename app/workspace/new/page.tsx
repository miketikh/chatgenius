"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createWorkspaceAction } from "@/actions/db/workspaces-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@clerk/nextjs"

export default function NewWorkspacePage() {
  const router = useRouter()
  const { userId } = useAuth() // Clerk client side
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !userId) return

    const res = await createWorkspaceAction(
      {
        name,
        description,
        type: "public",
        creatorId: userId
      },
      [userId]
    )
    if (res.isSuccess) {
      router.push(`/workspace/${res.data.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h1 className="mb-4 text-2xl font-semibold">Create Workspace</h1>
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <Label htmlFor="workspaceName">Name</Label>
          <Input
            id="workspaceName"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="workspaceDescription">Description</Label>
          <Input
            id="workspaceDescription"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
        <Button type="submit">Create</Button>
      </form>
    </div>
  )
}
