# OpenClaw Ops Stack

This directory contains the operational stack modules for OpenClaw, demonstrating canonical JSON hashing across multiple programming languages.

## Overview

The ops stack provides a foundation for building production-ready operations tooling with deterministic data serialization and hashing capabilities.

## Modules

### 1. Market Intelligence (`market-intelligence/`)
Market data aggregation and analysis with canonical hashing for consistent data representation.

**Features:**
- Market data fetching and processing
- Canonical JSON serialization
- Deterministic hashing for data integrity

### 2. Notifications (`notifications/`)
Multi-channel notification delivery system with audit trail support.

**Features:**
- Email, SMS, and push notifications
- Template management
- Canonical hashing for audit logs

### 3. Automation (`automation/`)
Workflow orchestration and task automation.

**Features:**
- Workflow definition and execution
- Event-driven automation
- Deterministic state hashing

### 4. Monetization (`monetization/`)
Payment processing and subscription management.

**Features:**
- Payment transaction handling
- Subscription lifecycle management
- Canonical transaction records

### 5. AI Engine (`ai-engine/`)
AI and ML capabilities with model versioning.

**Features:**
- Model inference
- Training pipeline support
- Deterministic model configuration hashing

## Canonical Hashing

All modules use RFC 8785 canonical JSON serialization via the `json-canonicalize` library. This ensures:

- **Deterministic serialization**: Same input always produces same output
- **Order independence**: Object keys are sorted
- **Reproducible hashes**: Enables content verification and deduplication

### Supported Languages

The devcontainer includes tooling for canonical hashing across multiple languages:

- **Node.js**: `json-canonicalize` (npm)
- **Go**: `webpki/jcs` library
- **Python**: `rfc8785` package
- **Rust**: `serde_jcs` crate
- **Java**: WebPKI/JCS via Maven/Gradle

## Usage

### Running Tests

```bash
# Using npm script
npm run test:ops-stack

# Or directly with tsx
npx tsx ops-stack/ops-stack.ts

# Or using the deployment script
./deploy-ops-stack.sh
```

### Example: Using a Module

```typescript
import { getMarketData, canonicalizeMarketData, hashMarketData } from './market-intelligence';

// Get market data
const data = getMarketData();

// Get canonical JSON representation
const canonical = canonicalizeMarketData(data);
console.log(canonical);

// Compute SHA-256 hash
const hash = await hashMarketData(data);
console.log(hash);
```

## Golden Hash Tests

The `ops-stack.ts` file includes a comprehensive test suite that validates:

1. **Canonical form generation**: Ensures JSON serialization follows RFC 8785
2. **Hash computation**: Verifies SHA-256 hashing of canonical data
3. **Deterministic behavior**: Confirms repeated operations produce identical results
4. **Module integration**: Tests all modules' canonicalization functions

### Test Output

```
🧪 Running Golden Hash Tests...

Test 1: Canonical JSON form
  ✓ PASSED

Test 2: SHA-256 hash of canonical form
  ✓ PASSED

Test 3: Deterministic hashing
  ✓ PASSED (deterministic)

Test 4: Module canonicalization
  ✓ PASSED (all modules)

✅ All golden hash tests passed!
```

## Development

### Adding a New Module

1. Create a directory under `ops-stack/`: `mkdir ops-stack/my-module`
2. Add a `README.md` describing the module
3. Create `index.ts` with module implementation
4. Import and use `json-canonicalize` for data canonicalization
5. Export functions for canonical serialization and hashing
6. Update `ops-stack.ts` to import and test your module

### Module Template

```typescript
import { canonicalize } from 'json-canonicalize';

export interface MyData {
  id: string;
  value: number;
}

export function createData(value: number): MyData {
  return {
    id: crypto.randomUUID(),
    value,
  };
}

export function canonicalizeData(data: MyData): string {
  return canonicalize(data);
}
```

## Deployment

The deployment script (`deploy-ops-stack.sh`) provides:

1. **Preflight checks**: Validates Node.js, package manager, and dependencies
2. **Build step**: Compiles TypeScript if needed
3. **Golden hash tests**: Runs validation tests
4. **Mock deployment**: Simulates production deployment steps

To run:

```bash
./deploy-ops-stack.sh
```

## CI/CD

The `.github/workflows/ops-stack-ci.yml` workflow automatically:

- Tests canonical hashing across all supported languages
- Validates devcontainer configuration
- Checks module structure
- Runs deployment script validation

## GitHub Codespaces

Open this repository in Codespaces for a pre-configured environment:

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/openclaw/openclaw)

The devcontainer includes all language runtimes and canonical hashing libraries pre-installed.

## References

- [RFC 8785: JSON Canonicalization Scheme (JCS)](https://www.rfc-editor.org/rfc/rfc8785)
- [json-canonicalize (npm)](https://www.npmjs.com/package/json-canonicalize)
- [cyberphone/json-canonicalization](https://github.com/cyberphone/json-canonicalization)

## License

MIT - See LICENSE file in the repository root.
