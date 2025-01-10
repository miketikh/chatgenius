import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { usersTable } from "./users-schema"

export const presenceStatusEnum = pgEnum("presence_status", [
  "online",
  "offline",
  "away"
])

export const presenceTable = pgTable("presence", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: presenceStatusEnum("status").notNull().default("offline"),
  statusText: text("status_text"),
  statusEmoji: text("status_emoji"),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
})

export type InsertPresence = typeof presenceTable.$inferInsert
export type SelectPresence = typeof presenceTable.$inferSelect
