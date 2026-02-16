# Parallel Hypothesis Tracking Architecture

## Overview

The parallel hypothesis tracking system extends OpenClaw's agent event infrastructure to track competing thoughts across multiple cognitive models (me/we/they/system) during agent execution.

## Quick Start

```typescript
import { createHypothesis, selectHypothesis, getHypothesesByModelType } from "./infra/hypothesis-events.js";

// Create competing hypotheses
const runId = "agent-run-123";
const h1 = createHypothesis(runId, "me", "Morning productivity is higher", 0.7);
const h2 = createHypothesis(runId, "system", "System load is lower at 6 AM", 0.8);

// Select winner
selectHypothesis(runId, h2);

// Query by model type
const grouped = getHypothesesByModelType(runId);
// { me: [...], we: [...], they: [...], system: [...] }
```

## Architecture

Hypothesis events flow through the existing agent event stream with monotonic sequence ordering per runId.

## API Reference

See source code: `src/infra/hypothesis-events.ts`

Run demo: `npx tsx src/infra/hypothesis-events-demo.ts`

Run tests: `pnpm vitest run src/infra/hypothesis-events.test.ts`

## Related Documentation

- `docs/handshakeos/ARCHITECTURE.md` - HandshakeOS-E system design
- `docs/handshakeos/README.md` - Full hypothesis store usage
- `src/infra/agent-events.ts` - Base agent event system
