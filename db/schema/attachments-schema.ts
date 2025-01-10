import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { directMessagesTable } from "./direct-messages-schema"
import { messagesTable } from "./messages-schema"

export const attachmentsTable = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  messageId: uuid("message_id").references(() => messagesTable.id, {
    onDelete: "cascade"
  }),
  directMessageId: uuid("direct_message_id").references(
    () => directMessagesTable.id,
    { onDelete: "cascade" }
  ),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  size: text("size").notNull(),
  type: text("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertAttachment = typeof attachmentsTable.$inferInsert
export type SelectAttachment = typeof attachmentsTable.$inferSelect
