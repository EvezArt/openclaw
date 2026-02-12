# Monetization Module

This module handles payment processing and subscription management.

## Features

- Payment processing
- Subscription management
- Usage tracking
- Canonical transaction hashing

## Usage

```typescript
import { processPayment } from './monetization';

await processPayment({
  amount: 99.99,
  currency: 'USD',
  customerId: 'cust_123',
});
```

## Dependencies

- json-canonicalize (npm) for deterministic JSON hashing
- Rust serde_jcs for high-performance canonicalization
