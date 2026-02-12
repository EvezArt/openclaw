# Notifications Module

This module handles notification delivery across multiple channels.

## Features

- Multi-channel notification delivery
- Template management
- Delivery tracking
- Canonical data hashing for audit trails

## Usage

```typescript
import { sendNotification } from './notifications';

await sendNotification({
  to: 'user@example.com',
  message: 'Hello from OpenClaw',
});
```

## Dependencies

- json-canonicalize (npm) for deterministic JSON hashing
