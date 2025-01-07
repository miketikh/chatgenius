"use server"

import { createUserAction, deleteUserAction } from "@/actions/db/users-actions"
import { db } from "@/db/db"
import { directMessagesTable, messagesTable } from "@/db/schema"
import { WebhookEvent } from "@clerk/nextjs/server"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { Webhook } from "svix"

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Error: Missing Svix headers")
    return new Response("Error occurred -- no svix headers", {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload)

  // Create a new Svix instance with your webhook secret
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || "")

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature
    }) as WebhookEvent
  } catch (err) {
    console.error("Error verifying webhook:", err)
    return new Response("Error occurred", {
      status: 400
    })
  }

  const eventType = evt.type
  console.log(`Processing webhook event: ${eventType}`)

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, username, first_name, last_name, image_url } =
      evt.data
    console.log(`Processing user data:`, {
      id,
      email_addresses,
      username,
      first_name,
      last_name
    })

    const email = email_addresses?.[0]?.email_address
    const fullName = `${first_name || ""} ${last_name || ""}`.trim()

    if (!email) {
      console.error("No email found for user")
      return new Response("No email found for user", { status: 400 })
    }

    // Generate a username if none exists
    const displayUsername = username || email.split("@")[0] || id
    console.log("Using username:", displayUsername)

    try {
      // Update or create user
      const result = await createUserAction({
        id,
        email,
        username: displayUsername,
        fullName: fullName || email,
        imageUrl: image_url,
        status: "offline"
      })

      // If this is a username update, sync it to all messages
      if (eventType === "user.updated") {
        // Update regular messages
        await db
          .update(messagesTable)
          .set({ username: displayUsername })
          .where(eq(messagesTable.userId, id))

        // Update direct messages
        await db
          .update(directMessagesTable)
          .set({ senderUsername: displayUsername })
          .where(eq(directMessagesTable.senderId, id))
      }

      console.log("User creation/update result:", result)
      return new Response("User processed successfully", { status: 200 })
    } catch (error) {
      console.error("Error creating/updating user in database:", error)
      return new Response("Error creating/updating user", { status: 500 })
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data
    try {
      await deleteUserAction(id as string)
      return new Response("User deleted successfully", { status: 200 })
    } catch (error) {
      console.error("Error deleting user from database:", error)
      return new Response("Error deleting user", { status: 500 })
    }
  }

  return new Response("Webhook processed successfully", { status: 200 })
}
