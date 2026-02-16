# HandshakeOS-E Quick Reference

## Installation

```typescript
// Import HandshakeOS-E components
import {
  eventStore,
  intentStore,
  hypothesisStore,
  testStore,
  createUserActor,
  createAgentActor,
  createSystemActor,
  createDeviceActor,
  createEmptyDomainSignature,
  createDomainSignature,
  generateId,
} from "./handshakeos/index.js";
```

## Quick Start: 5-Minute Tour

### 1. Create an Actor

```typescript
const user = createUserActor("user-123", "Alice");
// Result: { id: "user-123", type: "user", permissions: ["read", "write", "execute"], name: "Alice" }
```

### 2. Record an Event

```typescript
const event = {
  id: generateId(),
  timestamp: Date.now(),
  actor: user,
  type: "task-completed",
  payload: { taskId: "task-456", result: "success" },
  domainSignature: createEmptyDomainSignature(),
};
eventStore.store(event);
```

### 3. Create an Intent

```typescript
const intent = {
  id: generateId(),
  timestamp: Date.now(),
  actor: user,
  goal: "Complete project X",
  constraints: ["Budget: $10k", "Deadline: 2 weeks"],
  successMetric: "Project delivered on time",
  confidence: 0.8,
  eventIds: [event.id],
  measurable: true,
  domainSignature: createEmptyDomainSignature(),
};
intentStore.store(intent);
```

### 4. Create a Hypothesis

```typescript
const hypothesis = {
  id: generateId(),
  modelType: "me",
  description: "I work better in the morning",
  probability: 0.7,
  falsifiers: [{
    description: "Afternoon productivity exceeds morning",
    testCondition: "checkProductivity()",
    triggered: false,
  }],
  domainSignature: createEmptyDomainSignature(),
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  evidenceEventIds: [event.id],
  actor: user,
};
hypothesisStore.store(hypothesis);
```

### 5. Create a Test

```typescript
const test = {
  id: generateId(),
  name: "Morning productivity test",
  description: "Compare morning vs afternoon work",
  hypothesisIds: [hypothesis.id],
  testType: "hypothesis-validation",
  procedure: "Track task completion for 2 weeks",
  expectedOutcome: "Morning has 20% higher completion",
  status: "pending",
  createdAt: Date.now(),
  actor: user,
  domainSignature: createEmptyDomainSignature(),
};
testStore.store(test);
```

## Common Operations

### Events

```typescript
// Get event by ID
const event = eventStore.get("event-123");

// Query events by type
const taskEvents = eventStore.query({ type: "task-completed" });

// Get recent events
const recent = eventStore.getRecentEvents(10);

// Get event chain (causality)
const chain = eventStore.getEventChain("event-456");

// Get events by actor
const userEvents = eventStore.getEventsByActor(user);

// Get events by time range
const todayEvents = eventStore.query({
  startTime: Date.now() - 86400000,
  endTime: Date.now(),
});

// Export all events
const allEvents = eventStore.exportAll();
```

### Intents

```typescript
// Get intent by ID
const intent = intentStore.get("intent-123");

// Update intent state
intentStore.update("intent-123", {
  state: "executing",
  trigger: "User initiated",
});

// Update with payoff
intentStore.update("intent-123", {
  state: "completed",
  payoff: 0.9,
});

// Get pending intents
const pending = intentStore.getPendingIntents();

// Get intents by state
const executing = intentStore.getIntentsByState("executing");

// Get measurable intents
const measurable = intentStore.query({ measurable: true });
```

### Hypotheses

```typescript
// Get hypothesis by ID
const hyp = hypothesisStore.get("hyp-123");

// Update hypothesis probability
hypothesisStore.update("hyp-123", { probability: 0.8 });

// Add evidence
hypothesisStore.addEvidence("hyp-123", "event-456");

// Trigger falsifier
hypothesisStore.triggerFalsifier("hyp-123", 0);

// Get active hypotheses
const active = hypothesisStore.getActiveHypotheses();

// Get parallel models
const parallel = hypothesisStore.getParallelHypotheses();
// Result: { me: [...], we: [...], they: [...], system: [...] }

// Get by model type
const meModels = hypothesisStore.getByModelType("me");

// Get high-confidence hypotheses
const highConf = hypothesisStore.query({ minProbability: 0.8 });
```

### Tests

```typescript
// Get test by ID
const test = testStore.get("test-123");

// Record test run
testStore.recordTestRun("test-123", {
  status: "passed",
  actualOutcome: "Morning productivity was 25% higher",
});

// Get tests for hypothesis
const tests = testStore.getByHypothesis("hyp-123");

// Get failed tests
const failed = testStore.getFailedTests();

// Get pending tests
const pending = testStore.getPendingTests();
```

## Actor Types

```typescript
// User actor (human)
const user = createUserActor("user-id", "Username");

// Agent actor (AI/automation)
const agent = createAgentActor("agent-id", "Agent Name");

// System actor (infrastructure)
const system = createSystemActor();

// Device actor (hardware)
const device = createDeviceActor("device-id", "Device Name");
```

## Domain Signatures

```typescript
// Empty signature (unknown domain)
const empty = createEmptyDomainSignature();

// Signature with mixtures
const mixed = createDomainSignature({
  productivity: 0.8,
  social: 0.2,
  technical: 0.5,
});

// Result:
// {
//   version: "1.0.0",
//   mixtures: { productivity: 0.8, social: 0.2, technical: 0.5 },
//   updatedAt: 1234567890,
// }
```

## Query Patterns

### Filter by Multiple Criteria

```typescript
// Events: type + time range
const filtered = eventStore.query({
  type: "user-action",
  startTime: Date.now() - 3600000, // Last hour
  endTime: Date.now(),
  limit: 20,
});

// Intents: state + actor
const userIntents = intentStore.query({
  state: "executing",
  actorId: "user-123",
});

// Hypotheses: model + probability
const likelyMeModels = hypothesisStore.query({
  modelType: "me",
  minProbability: 0.7,
});

// Tests: status + hypothesis
const failedHypTests = testStore.query({
  status: "failed",
  hypothesisId: "hyp-123",
});
```

### Pagination

```typescript
// First page
const page1 = eventStore.query({ limit: 20, offset: 0 });

// Second page
const page2 = eventStore.query({ limit: 20, offset: 20 });
```

## Causality Tracking

```typescript
// Create parent event
const parent = {
  id: "parent-1",
  timestamp: Date.now(),
  actor: user,
  type: "parent-event",
  payload: {},
  domainSignature: createEmptyDomainSignature(),
};
eventStore.store(parent);

// Create child event
const child = {
  id: "child-1",
  timestamp: Date.now() + 1,
  actor: user,
  type: "child-event",
  payload: {},
  parentEventId: "parent-1", // Link to parent
  domainSignature: createEmptyDomainSignature(),
};
eventStore.store(child);

// Get event chain
const chain = eventStore.getEventChain("child-1");
// Result: [parent, child]

// Get all children
const children = eventStore.getChildEvents("parent-1");
// Result: [child]
```

## Reversal Pattern

```typescript
const event = {
  id: generateId(),
  timestamp: Date.now(),
  actor: user,
  type: "file-deleted",
  payload: { fileId: "file-123", path: "/data/file.txt" },
  reversalProcedure: "restoreFile('/data/file.txt', 'backup-123')",
  domainSignature: createEmptyDomainSignature(),
};
eventStore.store(event);

// Later, if reversal needed:
// 1. Get event
const evt = eventStore.get(event.id);
// 2. Execute reversal procedure
if (evt.reversalProcedure) {
  // Parse and execute: restoreFile('/data/file.txt', 'backup-123')
}
```

## Complete Workflow Example

```typescript
// 1. User action creates event
const actionEvent = {
  id: generateId(),
  timestamp: Date.now(),
  actor: createUserActor("alice", "Alice"),
  type: "task-started",
  payload: { taskName: "Write report" },
  domainSignature: createDomainSignature({ productivity: 1.0 }),
};
eventStore.store(actionEvent);

// 2. System creates intent from event
const intent = {
  id: generateId(),
  timestamp: Date.now(),
  actor: actionEvent.actor,
  goal: "Complete report by Friday",
  constraints: ["Quality: high", "Length: 10 pages"],
  successMetric: "Report approved",
  confidence: 0.75,
  state: "executing",
  eventIds: [actionEvent.id],
  measurable: true,
  domainSignature: actionEvent.domainSignature,
};
intentStore.store(intent);

// 3. Agent creates hypothesis
const hypothesis = {
  id: generateId(),
  modelType: "me",
  description: "Alice completes reports faster in the morning",
  probability: 0.6,
  falsifiers: [{
    description: "Afternoon completion rate exceeds morning",
    testCondition: "compareTimeOfDay()",
    triggered: false,
  }],
  domainSignature: actionEvent.domainSignature,
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  evidenceEventIds: [actionEvent.id],
  actor: createAgentActor("system-agent", "System Agent"),
};
hypothesisStore.store(hypothesis);

// 4. System creates test
const test = {
  id: generateId(),
  name: "Time-of-day productivity test",
  description: "Track task completion by time of day",
  hypothesisIds: [hypothesis.id],
  testType: "hypothesis-validation",
  procedure: "Track completion times for 2 weeks",
  expectedOutcome: "Morning shows 15%+ higher rate",
  status: "pending",
  createdAt: Date.now(),
  actor: createSystemActor(),
  domainSignature: actionEvent.domainSignature,
};
testStore.store(test);

// 5. Later: task completes
const completionEvent = {
  id: generateId(),
  timestamp: Date.now() + 3600000,
  actor: actionEvent.actor,
  type: "task-completed",
  payload: { 
    taskName: "Write report",
    duration: 3600000,
    quality: "high",
  },
  parentEventId: actionEvent.id,
  domainSignature: actionEvent.domainSignature,
};
eventStore.store(completionEvent);

// 6. Update intent with payoff
intentStore.update(intent.id, {
  state: "completed",
  payoff: 0.9, // High success
});

// 7. Add evidence to hypothesis
hypothesisStore.addEvidence(hypothesis.id, completionEvent.id);

// 8. Record test result
testStore.recordTestRun(test.id, {
  status: "passed",
  actualOutcome: "Morning completion rate was 18% higher",
});
```

## Tips and Best Practices

### Always Provide Actor Identity
```typescript
// ✅ Good
const event = { ...eventData, actor: createUserActor("id", "name") };

// ❌ Bad
const event = { ...eventData, actor: null };
```

### Use Meaningful Event Types
```typescript
// ✅ Good: Specific, actionable
type: "user-login-success"
type: "file-upload-completed"

// ❌ Bad: Vague, ambiguous
type: "event"
type: "action"
```

### Add Reversal Procedures When Possible
```typescript
// ✅ Good: Includes reversal
reversalProcedure: "deleteFile('/uploads/file-123.txt')"

// ⚠️ OK: Not always reversible
reversalProcedure: undefined
```

### Use Domain Mixtures for Cross-Domain Events
```typescript
// ✅ Good: Captures multiple aspects
domainSignature: createDomainSignature({
  productivity: 0.7,
  social: 0.3,
  technical: 0.5,
})

// ⚠️ OK: Empty when domain is unknown
domainSignature: createEmptyDomainSignature()
```

### Link Related Records
```typescript
// ✅ Good: Clear relationships
intent.eventIds = [event1.id, event2.id];
hypothesis.evidenceEventIds = [evidence1.id, evidence2.id];
test.hypothesisIds = [hyp1.id, hyp2.id];
```

## Common Pitfalls

### Don't Reuse IDs
```typescript
// ❌ Bad: ID collision
eventStore.store({ id: "event-1", ... });
eventStore.store({ id: "event-1", ... }); // Error!

// ✅ Good: Always generate new IDs
const id1 = generateId();
const id2 = generateId();
```

### Don't Forget Timestamps
```typescript
// ❌ Bad: Invalid timestamp
const event = { timestamp: 0, ... };

// ✅ Good: Current timestamp
const event = { timestamp: Date.now(), ... };
```

### Don't Skip Falsifiers
```typescript
// ⚠️ Weak: No falsifier
falsifiers: []

// ✅ Strong: Clear falsifier
falsifiers: [{
  description: "Counter-evidence observed",
  testCondition: "checkCounterEvidence()",
  triggered: false,
}]
```

## Testing Your Code

```typescript
import { describe, test, expect, beforeEach } from "vitest";

describe("My HandshakeOS Integration", () => {
  beforeEach(() => {
    // Clear stores before each test
    eventStore.clear();
    intentStore.clear();
    hypothesisStore.clear();
    testStore.clear();
  });

  test("records events correctly", () => {
    const actor = createUserActor("test-user", "Test");
    const event = {
      id: generateId(),
      timestamp: Date.now(),
      actor,
      type: "test-event",
      payload: {},
      domainSignature: createEmptyDomainSignature(),
    };
    
    eventStore.store(event);
    
    const retrieved = eventStore.get(event.id);
    expect(retrieved).toEqual(event);
  });
});
```

## Further Reading

- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- **Design Rationale**: See [DESIGN_RATIONALE.md](./DESIGN_RATIONALE.md) for decisions
- **Full Documentation**: See [README.md](./README.md) for comprehensive guide
- **Example Code**: See `src/handshakeos/example.ts` for working demo
