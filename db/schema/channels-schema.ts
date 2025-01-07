import { relations } from "drizzle-orm"
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"
import { usersTable } from "./users-schema"

export const channelTypeEnum = pgEnum("channel_type", ["public", "private"])

export const channelsTable = pgTable("channels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: channelTypeEnum("type").default("public").notNull(),
  creatorId: text("creator_id")
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const channelMembersTable = pgTable("channel_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  channelId: uuid("channel_id")
    .references(() => channelsTable.id, { onDelete: "cascade" })
    .notNull(),
  userId: text("user_id")
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

// Define relationships
export const channelsRelations = relations(channelsTable, ({ many }) => ({
  members: many(channelMembersTable)
}))

export const channelMembersRelations = relations(
  channelMembersTable,
  ({ one }) => ({
    channel: one(channelsTable, {
      fields: [channelMembersTable.channelId],
      references: [channelsTable.id]
    })
  })
)

export type InsertChannel = typeof channelsTable.$inferInsert
export type SelectChannel = typeof channelsTable.$inferSelect
export type InsertChannelMember = typeof channelMembersTable.$inferInsert
export type SelectChannelMember = typeof channelMembersTable.$inferSelect
