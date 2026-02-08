# Live Event Stream

OpenClaw provides a live event stream that broadcasts agent events to connected WebSocket clients. This enables real-time monitoring and always-on UIs.

## Event Stream Overview

The event stream broadcasts all agent activity including:

- **System Events**: Run lifecycle (started, completed, failed), heartbeats
- **Hypothesis Events**: Planning and hypothesis generation
- **Chat Events**: Message deltas and completions
- **Error Events**: Runtime and validation errors

## Subscribing to Events

### Via WebSocket

Events are automatically broadcast to all connected WebSocket clients through the Gateway server. The Gateway WebSocket endpoint is available at:

```
ws://localhost:18789
```

Events are sent as JSON frames with the following structure:

```json
{
  "type": "event",
  "event": "agent",
  "payload": {
    "runId": "run_1234567890_abcdef",
    "seq": 1,
    "stream": "lifecycle",
    "ts": 1707425736513,
    "data": {
      "type": "system.run_started",
      "message": "CrawFather planning cycle started"
    },
    "sessionKey": "agent:crawfather:main"
  },
  "seq": 42
}
```

### Event Types

#### System Events

- `system.run_started`: Agent run has started
- `system.run_completed`: Agent run completed successfully
- `system.run_failed`: Agent run failed with error
- `system.heartbeat`: Periodic heartbeat signal

#### Hypothesis Events

- `hypothesis.created`: New hypothesis added to the store
- `hypothesis.updated`: Hypothesis status changed (pending → active → completed)

#### Chat Events

- `chat.message`: Complete chat message
- `chat.delta`: Streaming chat delta
- `chat.final`: Final chat message state

#### Error Events

- `error.runtime`: Runtime error occurred
- `error.validation`: Validation error occurred

## AgentEvent Schema

All events follow the `AgentEventPayload` schema:

```typescript
type AgentEventPayload = {
  runId: string;        // Unique run identifier
  seq: number;          // Monotonic sequence number per run
  stream: string;       // Event stream (lifecycle, tool, assistant, error)
  ts: number;           // Timestamp (milliseconds since epoch)
  data: Record<string, unknown>;  // Event-specific data
  sessionKey?: string;  // Session context key
};
```

## Event Streams

Events are categorized into streams:

- `lifecycle`: System and hypothesis events
- `assistant`: Chat and AI assistant events
- `tool`: Tool execution events
- `error`: Error events

## Session Keys

Events are scoped to sessions via `sessionKey`. Common session keys:

- `agent:crawfather:main`: Main CrawFather planning session
- `agent:crawfather:heartbeat`: CrawFather heartbeat session
- `user:<userId>`: User-specific sessions

## Example: Listening to Events

```typescript
import { globalEventBus } from "openclaw/events/emitter";

// Subscribe to all events
const unsubscribe = globalEventBus.subscribe((event) => {
  console.log("Event received:", event);
  
  if (event.data.type === "hypothesis.created") {
    console.log("New hypothesis:", event.data.hypothesis.text);
  }
});

// Unsubscribe when done
unsubscribe();
```

## Running the Gateway

Start the Gateway server to enable event streaming:

```bash
pnpm openclaw gateway run
```

Or in development mode:

```bash
pnpm gateway:dev
```

## See Also

- [CrawFather Agent](./crawfather.md)
- [Gateway Configuration](./gateway/README.md)
