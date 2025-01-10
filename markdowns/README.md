# Project Documentation

## Overview

This is a modern web application built with Next.js, featuring real-time chat functionality and workspace management. The application uses a robust tech stack including Supabase for the database and Clerk for authentication.

## Tech Stack

### Frontend

- Next.js 13+ with App Router
- Tailwind CSS for styling
- Shadcn UI components
- Framer Motion for animations

### Backend

- PostgreSQL database (Supabase)
- Drizzle ORM for database operations
- Server Actions for API endpoints
- Real-time subscriptions

### Services

- Clerk for authentication
- AWS S3 for file storage

## Project Structure

### Core Directories

#### `/app`

Next.js application root with emphasis on the workspace functionality:

##### Workspace Structure

- Complex message handling system
  - Real-time updates
  - Threading support
  - Rich text input
  - File attachments

##### Core Components

- Navigation system
  - Workspace switching
  - Channel management
  - Direct messaging
  - Member presence

##### Real-time Features

- Instant messaging
- Presence indicators
- Typing notifications
- Read receipts

##### Search Capabilities

- Global search
- Advanced filtering
- Result highlighting
- Search analytics

[Detailed App Documentation](./app.md)

#### `/actions`

Server-side actions:

- Database operations
- File uploads
- Search functionality
- Payment processing

[Detailed Actions Documentation](./actions.md)

#### `/db`

Database configuration and schemas:

- Table definitions
- Type exports
- Relationships
- Migration handling

[Detailed Database Documentation](./db.md)

#### `/lib`

Utility functions and hooks:

- Custom React hooks
- Service integrations
- Helper functions
- Type definitions

[Detailed Library Documentation](./lib.md)

## Key Features

### Authentication

- Clerk integration
- Protected routes
- User management
- Session handling

### Real-time Communication

- Chat functionality
- Presence system
- Message threading
- File attachments

### Workspace Management

- Multi-workspace support
- Channel organization
- User roles and permissions
- Search functionality

## Development Patterns

### Component Architecture

- Server vs Client components
- Shared UI components
- Route-specific components
- Layout system

### Data Flow

- Server-side rendering
- Real-time subscriptions
- Optimistic updates
- Cache management

### Type Safety

- TypeScript throughout
- Schema-based types
- Action return types
- Component props

### Security

- Authentication checks
- Input validation
- XSS prevention
- CSRF protection

## Best Practices

### Code Organization

- Feature-based structure
- Clear separation of concerns
- Consistent naming conventions
- Proper type exports

### Performance

- Server-side rendering
- Proper caching
- Optimized images
- Bundle optimization

### Error Handling

- Proper error boundaries
- User feedback
- Logging
- Fallback UI

### State Management

- Server state
- Client state
- Real-time updates
- Form handling

## Common Workflows

### Adding New Features

1. Define database schema
2. Create server actions
3. Implement UI components
4. Add type definitions
5. Test functionality

### Handling Real-time Updates

1. Set up Supabase subscription
2. Create real-time hook
3. Implement optimistic updates
4. Handle edge cases

### Processing Payments

1. Configure Stripe product
2. Implement payment action
3. Handle webhooks
4. Update user status

### Managing Workspaces

1. Create workspace
2. Set up channels
3. Manage members
4. Handle permissions

## Development Setup

### Environment Variables

Required variables:

```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_SIGN_UP_URL=
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### Getting Started

1. Clone repository
2. Install dependencies
3. Set up environment variables
4. Run development server

### Development Commands

```bash
# Start development server
npm run dev

# Build production
npm run build

# Start production server
npm start

# Run type checking
npm run typecheck
```
