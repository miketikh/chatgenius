# Database Directory Documentation

## Overview

The database directory contains all database-related configurations, schemas, and migrations. It uses Drizzle ORM with PostgreSQL (via Supabase) as the database provider.

## Structure

### Core Files

- `db.ts`: Central configuration file that initializes the database connection and exports the db client

### Schemas (`/schema`)

#### Core Schemas

- `users-schema.ts`: Base user information
- `profiles-schema.ts`: Extended user profile data
- `workspaces-schema.ts`: Workspace management
- `channels-schema.ts`: Channel configuration within workspaces

#### Communication Schemas

- `messages-schema.ts`: General message structure
- `direct-messages-schema.ts`: Direct messaging between users
- `attachments-schema.ts`: File attachments for messages

#### Utility Schemas

- `todos-schema.ts`: Todo items management

## Schema Patterns

### Common Fields

All schemas include:

- `id`: UUID primary key
- `createdAt`: Timestamp with default now()
- `updatedAt`: Timestamp with auto-update

### Relationships

- Foreign keys use cascade delete where appropriate
- Many-to-many relationships use junction tables
- User associations use Clerk's userId

### Type Exports

Each schema exports:

- `Insert[Model]`: Type for inserting records
- `Select[Model]`: Type for selected records

## Example Schema Structure

```typescript
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core"

export const exampleTable = pgTable("example", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
})

export type InsertExample = typeof exampleTable.$inferInsert
export type SelectExample = typeof exampleTable.$inferSelect
```

## Database Operations

### Connection

- Uses Supabase connection string
- Pooled connections for better performance
- Environment-based configuration

### Migrations

- Handled automatically by Drizzle
- No manual migration files needed
- Schema changes are tracked in version control

### Type Safety

- Full TypeScript support
- Type inference from schema definitions
- Compile-time type checking for queries

## Best Practices

### Schema Design

- Use meaningful column names
- Include appropriate indexes
- Implement proper constraints
- Follow naming conventions

### Data Integrity

- Foreign key constraints
- Not null constraints where appropriate
- Default values for required fields

### Performance

- Appropriate column types
- Indexed frequently queried fields
- Optimized relationship structures
