# AI Engine Module

This module provides AI and ML capabilities for the ops stack.

## Features

- Model inference
- Training pipeline management
- Feature extraction
- Deterministic model versioning

## Usage

```typescript
import { runInference } from './ai-engine';

const result = await runInference({
  model: 'classifier-v1',
  input: {...},
});
```

## Dependencies

- json-canonicalize (npm) for deterministic JSON hashing
- Python rfc8785 for ML pipeline data
- Java WebPKI/JCS for enterprise integration
