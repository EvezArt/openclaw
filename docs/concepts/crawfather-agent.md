---
summary: "CrawFather agent with parallel hypothesis tracking and live event streaming"
title: CrawFather Agent
read_when: "You want to use the CrawFather agent with advanced parallel thinking capabilities."
status: experimental
---

# CrawFather Agent 🦞🧠

The **CrawFather agent** (`agent:crawfather:main`) is an experimental agent that provides parallel hypothesis tracking and live event streaming for advanced reasoning workflows.

## Features

### Parallel Hypothesis Tracking

CrawFather maintains multiple active hypotheses simultaneously while solving problems. Each hypothesis is:

- **Scored** (0-1 confidence level)
- **Tracked** through lifecycle stages (created → updated → resolved)
- **Evaluated** with evidence gathering
- **Resolved** with outcomes (confirmed, rejected, merged)

### Live Event Streaming

CrawFather emits rich event streams that provide real-time visibility into the agent's reasoning process:

#### Event Types

1. **System Events** (`stream: "system"`)
   - `run_started` - Agent run has begun
   - `run_completed` - Run finished successfully
   - `run_failed` - Run encountered an error

2. **Hypothesis Events** (`stream: "hypothesis"`)
   - `created` - New hypothesis formed
   - `updated` - Hypothesis score or evidence updated
   - `evidence` - Supporting evidence found
   - `resolved` - Hypothesis outcome determined

3. **Heartbeat Events** (`stream: "heartbeat.run"`)
   - Periodic health checks during long-running operations

#### Event Payload Structure

All events include standard metadata:

```typescript
{
  runId: string;      // Unique run identifier
  sessionKey: string; // Session context
  seq: number;        // Monotonic sequence number
  ts: number;         // Unix timestamp (ms)
  stream: string;     // Event type
  data: {             // Event-specific payload
    // ... 
  }
}
```

Example hypothesis event:

```json
{
  "runId": "run-abc123",
  "sessionKey": "agent:crawfather:main",
  "seq": 5,
  "ts": 1738960800000,
  "stream": "hypothesis",
  "data": {
    "subtype": "created",
    "hypothesisId": "h1",
    "hypothesis": "User wants to search for configuration files",
    "score": 0.85,
    "status": "active"
  }
}
```

## Configuration

### Basic Setup

Add the CrawFather agent to your `agents.list`:

```json5
{
  agents: {
    list: [
      {
        id: "crawfather",
        workspace: "~/.openclaw/workspace-crawfather",
        // Optional: custom identity
        identity: {
          name: "CrawFather",
          avatar: "🦞🧠"
        }
      }
    ]
  }
}
```

### Routing with Bindings

Route specific channels or patterns to CrawFather:

```json5
{
  bindings: [
    {
      agentId: "crawfather",
      match: {
        channel: "telegram",
        peer: { kind: "dm" }
      }
    },
    // Or route based on command prefix
    {
      agentId: "crawfather",
      match: {
        channel: "whatsapp",
        message: { prefix: "/think" }
      }
    }
  ]
}
```

### Session Scope

CrawFather works with both session scopes:

- `per-sender` (default) - Separate context per user
- `global` - Shared context across all interactions

```json5
{
  session: {
    scope: "per-sender",
    mainKey: "crawfather-primary"
  }
}
```

## TUI Integration

The OpenClaw TUI automatically displays hypothesis tracking when CrawFather is active:

```
⚡ Thinking (3 parallel hypotheses)
○ [85%] User wants to search for configuration files
○ [72%] Request is about documentation generation  
● [95%] Task involves file system operations
  ✓ confirmed: grep command executed successfully
```

### Status Icons

- `○` - Active hypothesis
- `●` - Resolved hypothesis
- `✗` - Rejected hypothesis

### Outcome Icons

- `✓` - Confirmed
- `✗` - Rejected
- `⇒` - Merged with another hypothesis

## Gateway Integration

CrawFather events are automatically broadcast via the Gateway WebSocket:

```javascript
// Subscribe to agent events
ws.send(JSON.stringify({
  method: "subscribe",
  params: { events: ["agent"] }
}));

// Listen for hypothesis updates
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.event === "agent" && msg.payload.stream === "hypothesis") {
    console.log("Hypothesis:", msg.payload.data);
  }
};
```

## Use Cases

### Complex Problem Solving

CrawFather excels at multi-step tasks where multiple approaches might be valid:

- **Code refactoring** - Explore different architectural patterns
- **Debugging** - Test multiple hypotheses about root causes
- **Research** - Parallel investigation of related topics

### Decision Support

Track competing options with evidence:

- **Feature design** - Compare implementation strategies
- **Data analysis** - Explore different analytical approaches
- **Planning** - Evaluate multiple execution paths

## Implementation Details

### Event Emission

Emit CrawFather events from your agent code:

```typescript
import {
  emitSystemEvent,
  emitHypothesisEvent,
  emitHeartbeatRunEvent
} from "openclaw/infra/agent-events";

// Start a run
emitSystemEvent(runId, "run_started", {
  agentId: "agent:crawfather:main"
});

// Create a hypothesis
emitHypothesisEvent(runId, {
  subtype: "created",
  hypothesisId: "h1",
  hypothesis: "User wants X",
  score: 0.85,
  status: "active"
});

// Update hypothesis score
emitHypothesisEvent(runId, {
  subtype: "updated",
  hypothesisId: "h1",
  score: 0.92,
  evidence: "Found supporting pattern"
});

// Resolve hypothesis
emitHypothesisEvent(runId, {
  subtype: "resolved",
  hypothesisId: "h1",
  outcome: "confirmed",
  reason: "Task completed successfully",
  status: "resolved"
});
```

### Event Testing

Test event handling in your integration tests:

```typescript
import { onAgentEvent } from "openclaw/infra/agent-events";

const stop = onAgentEvent((evt) => {
  if (evt.stream === "hypothesis") {
    // Verify hypothesis lifecycle
  }
});
```

## Limitations

- **Experimental**: API may change in future versions
- **Performance**: High event volume may impact WebSocket performance
- **Compatibility**: Requires OpenClaw gateway with event streaming support

## Next Steps

- [Multi-Agent Routing](/concepts/multi-agent) - Configure multiple agents
- [Gateway Configuration](/gateway/configuration) - Advanced gateway options
- [TUI Guide](/tui) - Terminal user interface features

---

_Questions? Check the [Agent Runtime](/concepts/agent) docs or join the community._ 🦞
