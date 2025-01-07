import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const userStatusEnum = pgEnum("user_status", [
  "online",
  "offline",
  "away"
])

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  username: text("username").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name").notNull(),
  imageUrl: text("image_url"),
  status: userStatusEnum("status").default("offline").notNull(),
  customStatus: text("custom_status"),
  lastSeen: timestamp("last_seen").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertUser = typeof usersTable.$inferInsert
export type SelectUser = typeof usersTable.$inferSelect
