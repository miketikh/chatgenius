"use server"

import { auth } from "@clerk/nextjs/server"
import SearchClient from "./_components/search-client"

interface SearchPageProps {
  params: {
    workspaceId: string
  }
}

export default async function SearchPage({ params }: SearchPageProps) {
  const { userId } = await auth()
  const { workspaceId } = await Promise.resolve(params)

  return <SearchClient workspaceId={workspaceId} userId={userId || ""} />
}
