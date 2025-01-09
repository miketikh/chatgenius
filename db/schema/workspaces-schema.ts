import { relations } from "drizzle-orm"
import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core"
import { usersTable } from "./users-schema"

export const workspaceTypeEnum = pgEnum("workspace_type", ["public", "private"])

export const workspacesTable = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: workspaceTypeEnum("type").default("public").notNull(),
  creatorId: text("creator_id")
    .references(() => usersTable.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export const workspaceMembersTable = pgTable(
  "workspace_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspacesTable.id, { onDelete: "cascade" })
      .notNull(),
    userId: text("user_id")
      .references(() => usersTable.id)
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date())
  },
  table => {
    return {
      // This ensures that (workspaceId, userId) is unique
      workspaceUserUnique: uniqueIndex("workspace_user_unique").on(
        table.workspaceId,
        table.userId
      )
    }
  }
)

// Define relationships
export const workspacesRelations = relations(workspacesTable, ({ many }) => ({
  members: many(workspaceMembersTable)
}))

export const workspaceMembersRelations = relations(
  workspaceMembersTable,
  ({ one }) => ({
    workspace: one(workspacesTable, {
      fields: [workspaceMembersTable.workspaceId],
      references: [workspacesTable.id]
    })
  })
)

export type InsertWorkspace = typeof workspacesTable.$inferInsert
export type SelectWorkspace = typeof workspacesTable.$inferSelect
export type InsertWorkspaceMember = typeof workspaceMembersTable.$inferInsert
export type SelectWorkspaceMember = typeof workspaceMembersTable.$inferSelect
