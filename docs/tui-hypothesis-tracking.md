# CrawFather Survival Pack: Hypothesis Tracking in TUI

This document describes how the OpenClaw TUI subscribes to and renders parallel hypotheses from CrawFather runs.

## Architecture Overview

The CrawFather Survival Pack integrates live event streaming with a visual hypothesis panel in the TUI. The system tracks multiple parallel hypotheses with their scores, statuses, and outcomes.

## Event Stream Types

The following event stream types are used (defined in `src/infra/agent-events.ts`):

- **`system`**: System-level events
- **`heartbeat`**: Heartbeat/keepalive events
- **`hypothesis`**: Hypothesis lifecycle events (created/updated/evidence/resolved)
- **`error`**: Error events

All events carry the following metadata:
- `runId`: Unique identifier for the agent run
- `sessionKey`: Session identifier
- `seq`: Monotonic sequence number (per run)
- `ts`: Timestamp (milliseconds since epoch)

## Hypothesis Event Structure

Hypothesis events are emitted on the `hypothesis` stream with the following data structure:

```typescript
{
  kind: "created" | "updated" | "evidence" | "resolved",
  hypothesisId: string,
  timestamp: number,
  data: {
    description?: string,      // Hypothesis description
    score?: number,            // Confidence score (0-1)
    status?: "active" | "stale" | "resolved",
    outcome?: "accepted" | "rejected" | "abandoned" | null,
    evidence?: {               // For "evidence" kind
      description: string,
      weight: number,
      timestamp: number
    }
  }
}
```

## Component Architecture

### 1. HypothesisTracker (`src/tui/hypothesis-tracker.ts`)

The `HypothesisTracker` class maintains the state of all hypotheses across CrawFather runs:

- Processes incoming hypothesis events
- Maintains per-run hypothesis maps
- Tracks run metadata (runId, sessionKey, seq, ts)
- Provides query methods for retrieving hypotheses
- Implements automatic pruning of old runs to prevent memory growth

**Key Methods:**
- `processEvent(event: HypothesisEvent)`: Process an incoming hypothesis event
- `getRunHypotheses(runId: string)`: Get all hypotheses for a specific run
- `getHypothesis(runId, hypothesisId)`: Get a specific hypothesis
- `clearRun(runId)`: Clear tracking data for a run
- `pruneOldRuns()`: Remove old runs (10+ minutes, keeping max 200 runs)

### 2. HypothesisPanel (`src/tui/components/hypothesis-panel.ts`)

The `HypothesisPanel` component renders the visual "Thinking (parallel hypotheses)" panel:

- Displays hypothesis status indicators (● active, ○ stale, ✓ resolved)
- Shows confidence scores as percentages
- Highlights outcomes (✓ accepted, ✗ rejected, ⊘ abandoned)
- Displays elapsed time and evidence count
- Automatically hides when no hypotheses are present

**Key Methods:**
- `render(hypotheses: Hypothesis[])`: Update panel with current hypotheses
- `hide()`: Hide the panel

### 3. Event Handler Integration (`src/tui/tui-event-handlers.ts`)

The `createEventHandlers` function integrates hypothesis tracking into the TUI event loop:

1. **Initialize tracker**: Creates a `HypothesisTracker` instance
2. **Handle hypothesis events**: Processes `hypothesis` stream events
3. **Filter by run**: Only renders hypotheses for the active chat run
4. **Update panel**: Calls `hypothesisPanel.render()` with current hypotheses
5. **Request render**: Triggers TUI re-render to display changes

### 4. TUI Integration (`src/tui/tui.ts`)

The main TUI module wires everything together:

1. Creates the hypothesis panel container
2. Adds it to the TUI layout (between status and footer)
3. Passes the panel to event handlers
4. Applies the lobster palette theme for styling

## Subscription Model

The TUI subscribes to hypothesis events via the gateway's event stream:

```
Gateway → WebSocket → GatewayChatClient → TUI Event Handler → HypothesisTracker → HypothesisPanel → Render
```

**Flow:**

1. **Gateway emits events**: Agent code emits hypothesis events via `emitAgentEvent()`
2. **WebSocket delivers**: Events are streamed over the WebSocket connection
3. **Client receives**: `GatewayChatClient.onEvent` receives the event
4. **Handler processes**: `handleAgentEvent()` extracts hypothesis data
5. **Tracker updates**: `HypothesisTracker.processEvent()` updates state
6. **Panel renders**: `HypothesisPanel.render()` displays updated hypotheses
7. **TUI renders**: `tui.requestRender()` redraws the terminal

## Filtering and Display

- **Run filtering**: Only hypotheses for the active run (`state.activeChatRunId`) are displayed
- **Session filtering**: Hypotheses are tracked per-run, not per-session
- **Auto-hide**: Panel automatically hides when no hypotheses exist
- **Stale detection**: Hypotheses can be marked as "stale" via update events

## Status and Outcome Rendering

### Status Indicators
- **Active (●)**: Hypothesis is being actively evaluated (green)
- **Stale (○)**: Hypothesis is no longer active but not resolved (muted)
- **Resolved (✓)**: Hypothesis has reached a conclusion (accent)

### Outcomes (for resolved hypotheses)
- **Accepted (✓)**: Hypothesis was confirmed (green)
- **Rejected (✗)**: Hypothesis was disproven (red)
- **Abandoned (⊘)**: Hypothesis was abandoned without conclusion (yellow)

## Memory Management

The tracker implements automatic pruning:
- Keeps runs from the last 10 minutes
- Maximum 200 runs tracked
- Prunes to 150 runs when limit is exceeded
- Runs are deleted when explicitly cleared

## Testing

Tests are provided for:
- Hypothesis lifecycle events (created/updated/evidence/resolved)
- Multi-hypothesis tracking
- Multi-run tracking
- Formatting utilities (status, outcome, score, elapsed time)

See:
- `src/tui/hypothesis-tracker.test.ts`
- `src/tui/components/hypothesis-panel.test.ts`

## Usage Example

To emit hypothesis events from agent code:

```typescript
import { emitAgentEvent } from "../infra/agent-events.js";

// Create a hypothesis
emitAgentEvent({
  runId: "run-123",
  stream: "hypothesis",
  data: {
    kind: "created",
    hypothesisId: "h1",
    timestamp: Date.now(),
    description: "User wants to list files",
    score: 0.75,
    status: "active"
  }
});

// Add evidence
emitAgentEvent({
  runId: "run-123",
  stream: "hypothesis",
  data: {
    kind: "evidence",
    hypothesisId: "h1",
    timestamp: Date.now(),
    evidence: {
      description: "User mentioned 'ls' command",
      weight: 0.8,
      timestamp: Date.now()
    }
  }
});

// Resolve hypothesis
emitAgentEvent({
  runId: "run-123",
  stream: "hypothesis",
  data: {
    kind: "resolved",
    hypothesisId: "h1",
    timestamp: Date.now(),
    outcome: "accepted"
  }
});
```

The TUI will automatically render these hypotheses in the "Thinking (parallel hypotheses)" panel.
