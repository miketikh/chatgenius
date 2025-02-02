import { relations } from "drizzle-orm"
import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import { usersTable } from "./users-schema"
import { workspacesTable } from "./workspaces-schema"

export const directChatsTable = pgTable("direct_chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: text("workspace_id")
    .references(() => workspacesTable.id, { onDelete: "cascade" })
    .notNull(),
  user1Id: text("user1_id")
    .references(() => usersTable.id)
    .notNull(),
  user2Id: text("user2_id")
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const directMessagesTable = pgTable("direct_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => directChatsTable.id, { onDelete: "cascade" })
    .notNull(),
  senderId: text("sender_id")
    .references(() => usersTable.id)
    .notNull(),
  content: text("content").notNull(),
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  reactions: jsonb("reactions").default({}).notNull(),
  parentId: uuid("parent_id").references(() => directMessagesTable.id, {
    onDelete: "cascade"
  }),
  replyCount: integer("reply_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Add relations configuration
export const directChatsRelations = relations(directChatsTable, ({ many }) => ({
  messages: many(directMessagesTable)
}))

export const directMessagesRelations = relations(
  directMessagesTable,
  ({ one }) => ({
    chat: one(directChatsTable, {
      fields: [directMessagesTable.chatId],
      references: [directChatsTable.id]
    })
  })
)

export type InsertDirectChat = typeof directChatsTable.$inferInsert
export type SelectDirectChat = typeof directChatsTable.$inferSelect
export type InsertDirectMessage = typeof directMessagesTable.$inferInsert
export type SelectDirectMessage = typeof directMessagesTable.$inferSelect

// Type for reactions stored in jsonb
export interface DirectMessageReactions {
  [emoji: string]: string[] // Array of user IDs who reacted with this emoji
}
