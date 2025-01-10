# App Directory Documentation

## Overview

The app directory contains the Next.js application using the App Router pattern. It includes pages, layouts, components, and API routes organized in a hierarchical structure.

## Structure

### Root Files

- `layout.tsx`: Root layout component
- `page.tsx`: Home page component
- `globals.css`: Global styles

### Core Directories

#### Authentication (`/(auth)`)

- Protected by Clerk authentication
- `login/`: Login page and components
- `signup/`: Signup page and components
- Separate layout for auth pages

#### Workspace (`/workspace`)

Main application workspace containing:

- `_components/`: Shared workspace components
- `[workspaceId]/`: Dynamic workspace routes
- `new/`: New workspace creation
- `page.tsx`: Workspace listing page

#### API Routes (`/api`)

Backend API endpoints:

- `webhooks/`: Webhook handlers for external services

## Workspace Structure

### Core Components

#### Message Components

- `message-list.tsx` (11KB):
  - Handles message rendering and organization
  - Supports threading and replies
  - Implements infinite scrolling
  - Manages message states (sending, sent, error)

#### Navigation Components

- `sidebar.tsx` (15KB):
  - Channel and DM navigation
  - Online user status
  - Workspace settings
  - Channel management
- `workspaces-sidebar.tsx` (18KB):
  - Workspace switching
  - Workspace creation
  - Workspace settings
  - Member management

#### Input Components

- `message-input.tsx`:
  - Rich text input
  - File attachments
  - Emoji support
  - Mentions and commands
- `emoji-picker.tsx`:
  - Emoji selection interface
  - Recent emojis
  - Category navigation

#### Content Components

- `channel-content.tsx`:
  - Channel message display
  - Channel information
  - Member list
  - Channel settings
- `thread-panel.tsx` (11KB):
  - Thread view and replies
  - Thread participants
  - Thread notifications

#### Search Components

- `top-search-bar.tsx` (12KB):
  - Global search interface
  - Advanced filters
  - Search history
  - Result highlighting
- `workspace-search.tsx`:
  - Workspace-specific search
  - Channel and DM filtering
  - Message search

### Dynamic Routes

#### Workspace Routes (`[workspaceId]`)

- `layout.tsx`: Workspace-specific layout
  - Sidebar integration
  - Real-time presence
  - Workspace context
- `page.tsx`: Default workspace view
  - Recent activity
  - Pinned items
  - Workspace overview

#### Channel Routes (`[workspaceId]/channel`)

- Channel-specific views
- Message history
- Channel settings
- Member permissions

#### Direct Message Routes (`[workspaceId]/dm`)

- Private conversations
- User presence
- Message history
- File sharing

#### Search Routes (`[workspaceId]/search`)

- Search results view
- Filter interface
- Result categorization
- Search analytics

## Component Interactions

### Message Flow

1. User input in `message-input.tsx`
2. Processing (mentions, commands, attachments)
3. Sending via server action
4. Real-time updates in `message-list.tsx`
5. Threading in `thread-panel.tsx`

### Navigation Flow

1. Workspace selection in `workspaces-sidebar.tsx`
2. Channel/DM selection in `sidebar.tsx`
3. Content loading in `channel-content.tsx`
4. Message history in `message-list.tsx`

### Search Flow

1. Query input in `top-search-bar.tsx`
2. Server-side search processing
3. Result rendering in search routes
4. Navigation to results

## State Management

### Workspace Context

- Current workspace
- User permissions
- Channel memberships
- Online status

### Message Context

- Current channel/DM
- Thread state
- Draft messages
- Upload state

### UI State

- Sidebar collapse
- Thread panel visibility
- Modal states
- Loading states

## Real-time Features

### Message Updates

- Instant message delivery
- Typing indicators
- Read receipts
- Online presence

### Notifications

- Message mentions
- Thread replies
- Channel updates
- Direct messages

### Synchronization

- Message order
- Edit conflicts
- Delete propagation
- User status

## Performance Optimizations

### Message Loading

- Virtualized lists
- Infinite scroll
- Optimistic updates
- Cache management

### Search

- Debounced queries
- Result caching
- Progressive loading
- Index optimization

### Media

- Image optimization
- Lazy loading
- Thumbnail generation
- Upload chunking

## Error Handling

### Message Errors

- Send failures
- Edit conflicts
- Delete errors
- Attachment issues

### Navigation Errors

- Route loading
- Permission denied
- Not found
- Network issues

### Real-time Errors

- Connection loss
- Reconnection
- State sync
- Presence updates
