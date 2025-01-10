# Library Directory Documentation

## Overview

The library directory contains utility functions, hooks, and service configurations that are used throughout the application. It provides core functionality and integrations with external services.

## Structure

### Root Files

- `s3.ts`: AWS S3 configuration and utilities for file storage
- `supabase.ts`: Supabase client configuration
- `utils.ts`: General utility functions

### Utils Directory (`/utils`)

- `sanitize.ts`: HTML sanitization utilities for secure content rendering

### Hooks Directory (`/hooks`)

- `use-realtime.ts`: Custom hook for real-time updates and subscriptions
- `use-copy-to-clipboard.tsx`: Hook for clipboard operations
- `use-mobile.tsx`: Hook for mobile device detection and responsive features
- `use-toast.ts`: Toast notification system hook

## Key Features

### External Service Integration

#### S3 Integration

- File upload/download utilities
- Presigned URL generation
- Bucket management functions

#### Supabase Integration

- Real-time subscription setup
- Database connection configuration
- Authentication helpers

### Custom Hooks

#### Real-time Hook

```typescript
const useRealtime = (channel: string) => {
  // Subscription management
  // Real-time updates
  // Connection state handling
}
```

#### UI Utility Hooks

- Clipboard management
- Mobile detection
- Toast notifications

### Utility Functions

#### Sanitization

- HTML content sanitization
- XSS prevention
- Safe content rendering

## Usage Patterns

### Hook Usage

```typescript
// Real-time updates
const { data, error } = useRealtime("channel-name")

// Toast notifications
const { toast } = useToast()
toast({ title: "Success", description: "Operation completed" })

// Clipboard
const { copy } = useCopyToClipboard()
copy("Text to copy")

// Mobile detection
const isMobile = useMobile()
```

### Service Configuration

```typescript
// S3
const s3Client = createS3Client()

// Supabase
const supabase = createSupabaseClient()
```

## Best Practices

### Hook Development

- Follow React hooks rules
- Include proper cleanup
- Handle loading and error states
- Type safety with TypeScript

### Service Integration

- Environment-based configuration
- Error handling
- Rate limiting consideration
- Security best practices

### Utility Functions

- Pure functions where possible
- Proper error handling
- Type safety
- Performance optimization
