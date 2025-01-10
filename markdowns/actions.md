# Actions Directory Documentation

## Overview

The actions directory contains all server actions used in the application. These are organized into two main categories:

1. Root-level actions for general functionality
2. Database-specific actions in the `db` subdirectory

## Structure

### Root Actions

- `search-actions.ts`: Handles search functionality across the application
- `presence-actions.ts`: Manages user presence and online status
- `upload-actions.ts`: Handles file upload operations
- `stripe-actions.ts`: Manages Stripe payment integrations

### Database Actions (`/db`)

- `messages-actions.ts`: CRUD operations for chat messages
- `attachments-actions.ts`: Manages file attachments
- `profiles-actions.ts`: Handles user profile operations
- `workspaces-actions.ts`: Manages workspace-related operations
- `direct-messages-actions.ts`: Handles direct messaging functionality
- `channels-actions.ts`: Manages channel operations
- `users-actions.ts`: Handles user-related operations
- `todos-actions.ts`: Manages todo items

## Key Features

### Action Pattern

All actions follow a consistent pattern:

- Server-side only (marked with "use server")
- Return type of `Promise<ActionState<T>>`
- Error handling with try-catch blocks
- Consistent success/error response format

### Database Integration

- DB actions use Drizzle ORM for database operations
- Direct integration with Supabase
- Type-safe operations using schema types

### Authentication

- Actions integrate with Clerk authentication
- User context is verified in relevant operations

## Common Usage Patterns

### Error Handling

```typescript
try {
  // Operation logic
  return {
    isSuccess: true,
    message: "Operation successful",
    data: result
  }
} catch (error) {
  console.error("Error:", error)
  return {
    isSuccess: false,
    message: "Operation failed"
  }
}
```

### Database Operations

- Create operations return the newly created item
- Read operations return arrays or single items
- Update operations return the updated item
- Delete operations return void

### Security

- All database operations verify user permissions
- Sensitive operations check workspace membership
- Rate limiting on critical operations
