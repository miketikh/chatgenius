import {
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid
} from "drizzle-orm/pg-core"
import { channelsTable } from "./channels-schema"
import { usersTable } from "./users-schema"

export const messagesTable = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id")
    .references(() => channelsTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => usersTable.id)
    .notNull(),
  content: text("content").notNull(),
  fileName: text("file_name"),
  fileUrl: text("file_url"),
  reactions: jsonb("reactions").default({}).notNull(),
  parentId: uuid("parent_id").references(() => messagesTable.id, {
    onDelete: "cascade"
  }),
  replyCount: integer("reply_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertMessage = typeof messagesTable.$inferInsert
export type SelectMessage = typeof messagesTable.$inferSelect

// Type for reactions stored in jsonb
export interface MessageReactions {
  [emoji: string]: string[] // Array of user IDs who reacted with this emoji
}
