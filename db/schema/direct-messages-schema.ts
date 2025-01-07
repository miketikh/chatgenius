import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { usersTable } from "./users-schema"

export const directChatsTable = pgTable("direct_chats", {
  id: uuid("id").defaultRandom().primaryKey(),
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
  senderUsername: text("sender_username").notNull(),
  content: text("content").notNull(),
  parentId: uuid("parent_id").references(() => directMessagesTable.id),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  reactions: jsonb("reactions").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertDirectChat = typeof directChatsTable.$inferInsert
export type SelectDirectChat = typeof directChatsTable.$inferSelect
export type InsertDirectMessage = typeof directMessagesTable.$inferInsert
export type SelectDirectMessage = typeof directMessagesTable.$inferSelect

// Type for reactions stored in jsonb
export interface DirectMessageReactions {
  [emoji: string]: string[] // Array of user IDs who reacted with this emoji
}
