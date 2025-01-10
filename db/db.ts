/*
<ai_context>
Initializes the database connection and schema for the app.
</ai_context>
*/

import {
  channelMembersTable,
  channelsTable,
  directChatsTable,
  directMessagesTable,
  messagesTable,
  presenceTable,
  profilesTable,
  usersTable,
  workspaceMembersTable,
  workspacesTable
} from "@/db/schema"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { attachmentsTable } from "./schema/attachments-schema"

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client, {
  schema: {
    profiles: profilesTable,
    users: usersTable,
    channels: channelsTable,
    channelMembers: channelMembersTable,
    messages: messagesTable,
    directChats: directChatsTable,
    directMessages: directMessagesTable,
    presence: presenceTable,

    // New:
    workspaces: workspacesTable,
    workspaceMembers: workspaceMembersTable,
    attachments: attachmentsTable
  }
})
