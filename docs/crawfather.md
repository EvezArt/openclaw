# CrawFather Agent

CrawFather is an always-on planning and hypothesis generation agent designed for continuous operation in the background.

## Overview

CrawFather runs periodic planning cycles that:

1. Emit `system.run_started` event
2. Generate a sequence of hypotheses
3. Update hypothesis statuses through their lifecycle
4. Emit `system.run_completed` event

All events are broadcast via the live event stream for UI consumption.

## Running CrawFather

### Single Run

Run a single CrawFather planning cycle:

```typescript
import { runCrawFather } from "openclaw/agents/crawfather";

const runId = await runCrawFather({
  sessionKey: "agent:crawfather:main",
  hypothesisCount: 5,
  delayMs: 1000
});

console.log("CrawFather completed:", runId);
```

### Continuous Background Mode

Run CrawFather continuously in the background:

```bash
pnpm dev:crawfather
```

This starts:
- Periodic CrawFather runs (every 60 seconds)
- Heartbeat signals (every 30 seconds)
- Event logging to console

### Configuration

CrawFather accepts the following configuration options:

```typescript
type CrawFatherConfig = {
  sessionKey?: string;      // Session key (default: "agent:crawfather:main")
  hypothesisCount?: number; // Number of hypotheses to generate (default: 5)
  delayMs?: number;         // Delay between operations (default: 1000)
};
```

## Event Flow

### 1. Run Started

```json
{
  "runId": "run_1707425736513_abc123",
  "stream": "lifecycle",
  "data": {
    "type": "system.run_started",
    "ts": 1707425736513,
    "message": "CrawFather planning cycle started"
  },
  "sessionKey": "agent:crawfather:main"
}
```

### 2. Hypothesis Created

```json
{
  "runId": "run_1707425736513_abc123",
  "stream": "lifecycle",
  "data": {
    "type": "hypothesis.created",
    "hypothesis": {
      "id": "hyp_1707425737000_xyz789",
      "text": "Hypothesis 1: Evaluate system state and plan next action",
      "status": "pending"
    }
  },
  "sessionKey": "agent:crawfather:main"
}
```

### 3. Hypothesis Updated

```json
{
  "runId": "run_1707425736513_abc123",
  "stream": "lifecycle",
  "data": {
    "type": "hypothesis.updated",
    "hypothesis": {
      "id": "hyp_1707425737000_xyz789",
      "text": "Hypothesis 1: Evaluate system state and plan next action",
      "status": "active"
    }
  },
  "sessionKey": "agent:crawfather:main"
}
```

### 4. Run Completed

```json
{
  "runId": "run_1707425736513_abc123",
  "stream": "lifecycle",
  "data": {
    "type": "system.run_completed",
    "ts": 1707425740000,
    "message": "CrawFather planning cycle completed"
  },
  "sessionKey": "agent:crawfather:main"
}
```

## Hypothesis Lifecycle

Hypotheses progress through the following states:

1. **pending**: Initial state when hypothesis is created
2. **active**: Hypothesis is being evaluated
3. **completed**: Hypothesis evaluation completed successfully
4. **rejected**: Hypothesis was rejected or invalidated

## Architecture

CrawFather uses the following runtime primitives:

- **RunRegistry**: Tracks active runs with session context and sequence numbers
- **HypothesisStore**: Manages hypotheses and emits hypothesis events
- **EventBus**: Broadcasts events to all subscribers

## Use Cases

### Always-On UI

CrawFather provides continuous event flow for UIs that need to stay alive without closing:

```typescript
import { globalEventBus } from "openclaw/events/emitter";

globalEventBus.subscribe((event) => {
  if (event.sessionKey === "agent:crawfather:main") {
    updateUI(event);
  }
});
```

### Monitoring Dashboard

Build dashboards that monitor CrawFather planning activity:

```typescript
const hypotheses = [];

globalEventBus.subscribe((event) => {
  if (event.data.type === "hypothesis.created") {
    hypotheses.push(event.data.hypothesis);
    renderHypothesesList(hypotheses);
  }
});
```

### Integration Testing

Test agent behavior by listening to events:

```typescript
const events = [];

const unsubscribe = globalEventBus.subscribe((event) => {
  events.push(event);
});

await runCrawFather({ hypothesisCount: 3 });

expect(events[0].data.type).toBe("system.run_started");
expect(events[1].data.type).toBe("hypothesis.created");
// ...
```

## Development Mode

The `dev:crawfather` script is designed for Codespaces and always-on development:

- Runs CrawFather in a continuous loop
- Logs events to console for debugging
- Graceful shutdown on Ctrl+C
- Configurable intervals for runs and heartbeats

## See Also

- [Live Event Stream](./live-events.md)
- [Agent Events](./reference/agent-events.md)
- [Gateway Server](./gateway/README.md)
