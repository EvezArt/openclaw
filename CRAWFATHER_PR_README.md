# CrawFather Survival Pack PR

This PR implements the CrawFather Survival Pack integration as requested in the issue.

## Quick Start for Reviewers

### Key Files to Review
1. **Core Implementation:**
   - `src/tui/hypothesis-tracker.ts` - Hypothesis state management
   - `src/tui/components/hypothesis-panel.ts` - TUI panel rendering
   - `src/tui/tui-event-handlers.ts` - Event processing
   - `src/infra/agent-events.ts` - Event stream types

2. **Types:**
   - `src/tui/hypothesis-types.ts` - Type definitions

3. **Tests:**
   - `src/tui/hypothesis-tracker.test.ts` - Tracker tests (9 tests)
   - `src/tui/components/hypothesis-panel.test.ts` - Panel tests (13 tests)

4. **Documentation:**
   - `docs/tui-hypothesis-tracking.md` - Architecture and usage
   - `docs/crawfather-survival-pack-summary.md` - Complete summary
   - `src/tui/hypothesis-example.ts` - Code examples

### What This Adds

**Live Event Streaming:**
- Extended AgentEventStream with `system`, `heartbeat`, `hypothesis`, `error`
- Full run tracking with runId/sessionKey/seq/ts

**Hypothesis Panel:**
- Visual "Thinking (parallel hypotheses)" panel in TUI
- Shows hypothesis status (● active, ○ stale, ✓ resolved)
- Displays scores (0-100%), outcomes (accepted/rejected/abandoned)
- Evidence counts and elapsed time

**Event Processing:**
- Lifecycle events: created → updated → evidence → resolved
- Automatic memory management (prunes old runs)
- Filtered by active run (only shows current chat hypotheses)

### Testing

```bash
# Run hypothesis tests
npx vitest run src/tui/hypothesis-tracker.test.ts --config vitest.unit.config.ts
npx vitest run src/tui/components/hypothesis-panel.test.ts --config vitest.unit.config.ts

# Run all TUI tests (should pass)
npx vitest run src/tui/ --config vitest.unit.config.ts

# Lint
npx oxlint src/tui/hypothesis-*.ts src/tui/components/hypothesis-panel.ts

# Format check
npx oxfmt --check src/tui/hypothesis-*.ts src/tui/components/hypothesis-panel.ts

# Type check
npx tsc --noEmit
```

### Verification Checklist

- ✅ All tests pass (89 total)
- ✅ No linting errors
- ✅ No TypeScript errors
- ✅ No CODEX_SANDBOX env var changes
- ✅ Follows repo conventions:
  - Exhaustive pattern matching
  - Collapsible ifs
  - Theme helpers (lobster palette)
  - Text wrapping
- ✅ Documentation complete
- ✅ Examples provided

### Usage Example

```typescript
import { emitAgentEvent } from "../infra/agent-events.js";

// Create hypothesis
emitAgentEvent({
  runId: "run-123",
  stream: "hypothesis",
  sessionKey: "agent:main:user",
  data: {
    kind: "created",
    hypothesisId: "h1",
    timestamp: Date.now(),
    description: "User wants to list files",
    score: 0.75,
    status: "active",
  },
});

// Resolve hypothesis
emitAgentEvent({
  runId: "run-123",
  stream: "hypothesis",
  sessionKey: "agent:main:user",
  data: {
    kind: "resolved",
    hypothesisId: "h1",
    timestamp: Date.now(),
    outcome: "accepted",
  },
});
```

The TUI will automatically display these hypotheses in the panel.

### Integration Points

1. **Gateway → TUI:** Events flow through WebSocket to GatewayChatClient
2. **Event Handlers:** Process hypothesis events and update tracker
3. **Panel Rendering:** Displays hypotheses for active run only
4. **Memory Management:** Automatic pruning of old runs

### Files Changed (Summary)

- Core: 6 files (~450 LOC)
- Tests: 2 files (~300 LOC)
- Docs: 2 files (~700 LOC)
- Examples: 1 file (~350 LOC)
- **Total: ~1,800 LOC** (excluding package-lock.json)

### Questions?

See:
- `docs/tui-hypothesis-tracking.md` - Architecture details
- `docs/crawfather-survival-pack-summary.md` - Complete implementation summary
- `src/tui/hypothesis-example.ts` - Usage examples
