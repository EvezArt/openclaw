# Automation Module

This module provides workflow automation capabilities.

## Features

- Workflow orchestration
- Task scheduling
- Event-driven automation
- Deterministic state hashing

## Usage

```typescript
import { executeWorkflow } from './automation';

await executeWorkflow({
  name: 'daily-report',
  steps: [...],
});
```

## Dependencies

- json-canonicalize (npm) for deterministic JSON hashing
- Go webpki/jcs for cross-language compatibility
