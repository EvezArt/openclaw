# CrawFather Survival Pack Implementation Summary

This document provides a complete overview of the CrawFather Survival Pack integration added to OpenClaw.

## Overview

The CrawFather Survival Pack adds live event streaming for parallel hypothesis tracking in the OpenClaw TUI. It enables real-time visualization of hypothesis lifecycle (created/updated/evidence/resolved) with scores, statuses, and outcomes.

## Components Added

### 1. Event Stream Types (src/infra/agent-events.ts)

Extended `AgentEventStream` to support:
- `system`: System-level events
- `heartbeat`: Heartbeat/keepalive events  
- `hypothesis`: Hypothesis lifecycle events
- `error`: Error events (already existed)

All events maintain run tracking with `runId`, `sessionKey`, `seq`, and `ts`.

### 2. Type Definitions (src/tui/hypothesis-types.ts)

**Core Types:**
- `HypothesisStatus`: "active" | "stale" | "resolved"
- `HypothesisOutcome`: "accepted" | "rejected" | "abandoned" | null
- `HypothesisEventKind`: "created" | "updated" | "evidence" | "resolved"
- `HypothesisEvidence`: Evidence with description, weight, timestamp
- `Hypothesis`: Complete hypothesis with id, description, score, status, outcome, evidence
- `HypothesisEvent`: Event structure for hypothesis updates
- `CrawFatherRun`: Run tracking with runId, sessionKey, seq, ts, hypotheses

### 3. Hypothesis Tracker (src/tui/hypothesis-tracker.ts)

**Class: HypothesisTracker**

Manages hypothesis state across CrawFather runs:
- Processes incoming hypothesis events
- Maintains per-run hypothesis maps
- Tracks run metadata (runId, sessionKey, seq, ts)
- Provides query methods for retrieving hypotheses
- Implements automatic pruning (10+ min old, max 200 runs)

**Key Methods:**
- `processEvent(event)`: Process hypothesis lifecycle events
- `getRunHypotheses(runId)`: Get all hypotheses for a run
- `getHypothesis(runId, hypothesisId)`: Get specific hypothesis
- `setRunSessionKey(runId, sessionKey)`: Update session key
- `clearRun(runId)`: Clear run data
- `pruneOldRuns()`: Remove stale runs

**Exhaustive Pattern Matching:**
The `processEvent` method uses TypeScript's exhaustive checking with a `never` type guard:
```typescript
default: {
  const _exhaustive: never = kind;
  return _exhaustive;
}
```
This ensures all `HypothesisEventKind` values are handled.

### 4. Hypothesis Panel Component (src/tui/components/hypothesis-panel.ts)

**Class: HypothesisPanel**

TUI component for rendering the "Thinking (parallel hypotheses)" panel:

**Status Indicators:**
- Active (●): Green - hypothesis being actively evaluated
- Stale (○): Muted - no longer active but not resolved
- Resolved (✓): Accent - reached conclusion

**Outcome Indicators:**
- Accepted (✓): Green - hypothesis confirmed
- Rejected (✗): Red - hypothesis disproven
- Abandoned (⊘): Yellow - hypothesis abandoned

**Display Format:**
```
Thinking (parallel hypotheses)
● 75% User wants to list files
  2s ago · 1 evidence ✓ accepted
○ 60% Alternative hypothesis  
  5s ago · 0 evidences
```

**Key Methods:**
- `render(hypotheses)`: Update panel with current hypotheses
- `hide()`: Clear panel content
- `isVisible()`: Check visibility state

**Theme Integration:**
Uses lobster palette colors via theme parameter:
- `accent`: Primary accent color
- `success`: Success/active indicators
- `error`: Error/rejected indicators
- `muted`: Dim/stale indicators
- `warn`: Warning/abandoned indicators

### 5. Event Handler Integration (src/tui/tui-event-handlers.ts)

Extended `createEventHandlers` to process hypothesis events:

**Added:**
- `HypothesisTracker` instance creation
- Hypothesis event handling for `hypothesis` stream
- System/heartbeat event tracking (updates session key)
- Filtering by active run (only shows hypotheses for current chat run)
- Panel rendering on hypothesis state changes

**Event Flow:**
1. Receive agent event
2. Check if `stream === "hypothesis"`
3. Extract hypothesis data (kind, hypothesisId, timestamp, data)
4. Process event through tracker
5. If active run, update panel with current hypotheses
6. Request TUI render

### 6. TUI Integration (src/tui/tui.ts)

**Changes:**
- Import `HypothesisPanel` component
- Create `hypothesisContainer` in layout
- Instantiate `HypothesisPanel` with theme mapping
- Add container to TUI root (between status and footer)
- Pass panel to event handlers

**Layout:**
```
Header
ChatLog
StatusContainer
HypothesisContainer  ← NEW
Footer
Editor
```

### 7. Documentation (docs/tui-hypothesis-tracking.md)

Comprehensive documentation covering:
- Architecture overview
- Event stream types
- Hypothesis event structure
- Component architecture
- Subscription model
- Filtering and display
- Status and outcome rendering
- Memory management
- Testing
- Usage examples

### 8. Tests

**hypothesis-tracker.test.ts** (9 tests):
- Create and track hypothesis
- Update hypothesis
- Add evidence
- Resolve hypothesis
- Multiple hypotheses per run
- Multiple runs
- Clear run data
- Unknown run/hypothesis handling

**hypothesis-panel.test.ts** (13 tests):
- Format status indicators
- Format outcomes
- Format scores
- Format elapsed time

All tests pass with existing TUI tests (86 total).

### 9. Example Code (src/tui/hypothesis-example.ts)

Demonstrates:
- Basic hypothesis lifecycle
- Parallel hypothesis evaluation
- Hypothesis rejection scenario
- Evidence accumulation
- System/heartbeat events

## Event Emission Pattern

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
    description: "User wants X",
    score: 0.75,
    status: "active",
  },
});

// Add evidence
emitAgentEvent({
  runId: "run-123",
  stream: "hypothesis",
  sessionKey: "agent:main:user",
  data: {
    kind: "evidence",
    hypothesisId: "h1",
    timestamp: Date.now(),
    evidence: {
      description: "Found keyword Y",
      weight: 0.9,
      timestamp: Date.now(),
    },
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

## Repo Conventions Followed

### ✅ Stylize Helpers
Used theme color functions (accent, success, error, muted, warn) from `src/tui/theme/theme.ts`.

### ✅ Text Wrapping
Hypotheses are displayed with proper line wrapping and formatting using Text components.

### ✅ Exhaustive Matches
Used TypeScript exhaustive checking in `HypothesisTracker.processEvent()` and formatting functions:
```typescript
default: {
  const _exhaustive: never = kind;
  return _exhaustive;
}
```

### ✅ Collapsible Ifs
Used early returns to reduce nesting:
```typescript
if (hypotheses.length === 0) {
  this.hide();
  return;
}
```

### ✅ Format/Lint
- Oxlint: 0 errors, 0 warnings
- Oxfmt: All files formatted correctly
- TypeScript: No compilation errors

## Testing Results

**Unit Tests:**
- ✅ 9 hypothesis-tracker tests
- ✅ 13 hypothesis-panel tests
- ✅ 6 tui-event-handlers tests
- ✅ 3 agent-events tests
- ✅ All other TUI tests (86 total)

**Linting:**
- ✅ Oxlint: 0 errors, 0 warnings
- ✅ Oxfmt: All files formatted

**Type Checking:**
- ✅ TypeScript: No errors

## Security Verification

✅ No changes to:
- `CODEX_SANDBOX_NETWORK_DISABLED_ENV_VAR`
- `CODEX_SANDBOX_ENV_VAR`

Verified with grep across all changed files.

## Subscription Model

The TUI subscribes to hypothesis events via the gateway's WebSocket stream:

```
Agent → emitAgentEvent() → listeners → WebSocket → 
GatewayChatClient → onEvent → handleAgentEvent → 
HypothesisTracker → HypothesisPanel → TUI render
```

**Filtering:**
- Only hypotheses for the active chat run are displayed
- Run-level filtering ensures clean separation of concurrent runs
- Automatic pruning prevents memory growth

**Memory Management:**
- Runs older than 10 minutes are pruned
- Maximum 200 runs tracked
- Prunes to 150 when limit exceeded

## Files Changed

1. `src/infra/agent-events.ts` - Extended event stream types
2. `src/tui/hypothesis-types.ts` - New type definitions
3. `src/tui/hypothesis-tracker.ts` - New tracker implementation
4. `src/tui/hypothesis-tracker.test.ts` - New tests
5. `src/tui/components/hypothesis-panel.ts` - New panel component
6. `src/tui/components/hypothesis-panel.test.ts` - New tests
7. `src/tui/tui-event-handlers.ts` - Extended event handling
8. `src/tui/tui.ts` - Integrated panel into layout
9. `docs/tui-hypothesis-tracking.md` - New documentation
10. `src/tui/hypothesis-example.ts` - Example usage

## Lines of Code

- **Core Implementation:** ~450 lines
- **Tests:** ~300 lines
- **Documentation:** ~350 lines
- **Examples:** ~350 lines
- **Total:** ~1,450 lines

## Future Enhancements

Possible future improvements:
- Keyboard shortcuts to expand/collapse hypothesis details
- Hypothesis filtering by status/outcome
- Export hypothesis history to log files
- Hypothesis visualization graph/tree view
- Performance metrics (hypothesis evaluation time)

## Conclusion

The CrawFather Survival Pack successfully integrates live event streaming with a visual hypothesis tracking panel in the OpenClaw TUI. The implementation follows all repository conventions, passes all tests, and provides comprehensive documentation for future developers.
