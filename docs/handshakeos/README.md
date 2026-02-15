# HandshakeOS-E Nervous System

## Overview

The HandshakeOS-E nervous system is a comprehensive event-driven architecture that provides universal event recording, intent tracking, parallel hypothesis management, and first-class test objects. The system is designed to be:

- **Domain-agnostic**: No primary domain required; all domain signatures are emergent mixture vectors
- **Fully auditable**: Every intervention is attributable and traceable
- **Reversible**: All events can be reversed with explicit procedures
- **Knowledge-grounded**: All knowledge comes from explicit sources (user input, device logs, user tests)

## Core Principles

### 1. Universal Event Records

All state shifts, routing decisions, negotiations, and interactions are captured as immutable event records:

```typescript
type EventRecord = {
  id: string;
  timestamp: number;
  actor: ActorIdentity;
  type: string;
  payload: Record<string, unknown>;
  domainSignature: DomainSignature;
  parentEventId?: string;
  reversalProcedure?: string;
  sessionId?: string;
  tags?: string[];
};
```

**Key features:**
- Unique ID for each event
- Actor attribution (no ghost agents)
- Optional parent-child relationships for causality
- Reversal procedures for auditability
- Tags for categorization

### 2. IntentToken System

Captures both pre-action planning and post-event outcomes:

```typescript
type IntentToken = {
  id: string;
  timestamp: number;
  actor: ActorIdentity;
  
  // Pre-action
  goal: string;
  constraints: string[];
  successMetric: string;
  confidence: number; // 0-1
  
  // Post-event
  trigger?: string;
  state?: "pending" | "executing" | "completed" | "failed" | "cancelled";
  defaultPolicy?: string;
  payoff?: number;
  
  eventIds: string[];
  measurable: boolean;
  domainSignature: DomainSignature;
};
```

**Key features:**
- Goal and constraint tracking
- Success metrics defined upfront
- Confidence levels before action
- Payoff measurement after execution
- Direct measurability indicator

### 3. Parallel Hypotheses

The system tracks four model types simultaneously:

- **me model**: Individual/personal perspective
- **we model**: Collaborative/group perspective
- **they model**: External/other perspective
- **system model**: Technical/infrastructure perspective

```typescript
type Hypothesis = {
  id: string;
  modelType: "me" | "we" | "they" | "system";
  description: string;
  probability: number; // 0-1
  falsifiers: Falsifier[];
  domainSignature: DomainSignature;
  version: number;
  evidenceEventIds: string[];
  actor: ActorIdentity;
};
```

**Key features:**
- Probability tracking
- Falsifiers for disproving hypotheses
- Evidence linking to events
- Version tracking for hypothesis evolution

### 4. First-Class Test Objects

Tests are linked to hypotheses for validation:

```typescript
type TestObject = {
  id: string;
  name: string;
  description: string;
  hypothesisIds: string[];
  testType: string;
  procedure: string;
  expectedOutcome: string;
  actualOutcome?: string;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  actor: ActorIdentity;
  domainSignature: DomainSignature;
};
```

**Key features:**
- Linked to one or more hypotheses
- Expected vs actual outcomes
- Status tracking
- Test procedure documentation

## Architecture

### Component Structure

```
src/handshakeos/
├── types.ts              # Core type definitions
├── event-store.ts        # Event record storage
├── intent-store.ts       # Intent token storage
├── hypothesis-store.ts   # Hypothesis tracking
├── test-store.ts         # Test object storage
├── utils.ts              # Helper utilities
└── index.ts              # Main entry point
```

### Data Flow

1. **Event Recording**
   - Actor performs action
   - Event record created with actor identity
   - Event stored with optional parent link
   - Reversal procedure documented

2. **Intent Lifecycle**
   - Intent created with goal and constraints
   - Confidence level set pre-action
   - Execution triggered
   - Payoff measured post-event
   - State updated to reflect outcome

3. **Hypothesis Evolution**
   - Hypothesis created with initial probability
   - Evidence events linked as they occur
   - Falsifiers monitored for triggering
   - Probability updated based on evidence
   - Version incremented on updates

4. **Test Execution**
   - Test linked to hypothesis
   - Procedure documented
   - Test run produces actual outcome
   - Status updated (passed/failed)
   - Results feed back to hypothesis

## Usage Examples

### Recording an Event

```typescript
import { eventStore, createUserActor, createEmptyDomainSignature, generateId } from "./handshakeos/index.js";

const actor = createUserActor("user-123", "Alice");
const event = {
  id: generateId(),
  timestamp: Date.now(),
  actor,
  type: "task-completed",
  payload: { taskId: "task-456", duration: 3600 },
  domainSignature: createEmptyDomainSignature(),
  tags: ["productivity", "work"],
};

eventStore.store(event);
```

### Creating an Intent

```typescript
import { intentStore, createUserActor, createEmptyDomainSignature, generateId } from "./handshakeos/index.js";

const actor = createUserActor("user-123", "Alice");
const intent = {
  id: generateId(),
  timestamp: Date.now(),
  actor,
  goal: "Complete quarterly report",
  constraints: ["Deadline: end of week", "Format: PDF"],
  successMetric: "Report approved by manager",
  confidence: 0.85,
  eventIds: [],
  measurable: true,
  domainSignature: createEmptyDomainSignature(),
};

intentStore.store(intent);

// Later, update with execution results
intentStore.update(intent.id, {
  state: "completed",
  trigger: "User initiated",
  payoff: 0.9,
});
```

### Creating a Hypothesis

```typescript
import { hypothesisStore, createUserActor, createEmptyDomainSignature, generateId } from "./handshakeos/index.js";

const actor = createUserActor("user-123", "Alice");
const hypothesis = {
  id: generateId(),
  modelType: "me" as const,
  description: "User is most productive in the morning",
  probability: 0.7,
  falsifiers: [
    {
      description: "User completes more tasks in afternoon",
      testCondition: "checkAfternoonProductivity()",
      triggered: false,
    },
  ],
  domainSignature: createEmptyDomainSignature(),
  version: 1,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  evidenceEventIds: [],
  actor,
};

hypothesisStore.store(hypothesis);

// Add evidence
hypothesisStore.addEvidence(hypothesis.id, "event-123");

// Trigger falsifier if condition met
hypothesisStore.triggerFalsifier(hypothesis.id, 0);
```

### Creating a Test

```typescript
import { testStore, createUserActor, createEmptyDomainSignature, generateId } from "./handshakeos/index.js";

const actor = createUserActor("user-123", "Alice");
const test = {
  id: generateId(),
  name: "Morning productivity test",
  description: "Measure task completion rate in morning vs afternoon",
  hypothesisIds: ["hyp-123"],
  testType: "hypothesis-validation",
  procedure: "compareMorningAfternoonProductivity()",
  expectedOutcome: "Morning shows 20% higher completion rate",
  status: "pending" as const,
  createdAt: Date.now(),
  actor,
  domainSignature: createEmptyDomainSignature(),
};

testStore.store(test);

// Record test run
testStore.recordTestRun(test.id, {
  status: "passed",
  actualOutcome: "Morning shows 22% higher completion rate",
});
```

## Design Constraints

### 1. No Single Domain Requirements

Domain signatures are emergent mixture vectors that can be:
- Empty (unknown domain)
- Sparse (partially known)
- Refined over time (versioned)

This allows the system to work across any domain without upfront categorization.

### 2. Actor Attribution

Every action must have an actor:
- **User**: Human actor with bounded permissions
- **Agent**: AI/automated actor with restricted permissions
- **System**: Infrastructure-level actor
- **Device**: Physical device actor

No "ghost" agents or hidden operations are allowed.

### 3. Reversibility

All events include optional reversal procedures:
- How to undo the action
- What state to restore
- Any compensating actions needed

This enables audit trails and rollback capabilities.

### 4. Knowability Sources

Knowledge must come from explicit sources:
- `user-input`: Direct user-provided information
- `device-log`: Device-generated logs
- `user-test`: User-initiated test results
- `explicit-measurement`: Measured outcomes

No implicit or inferred knowledge without clear provenance.

## Querying and Retrieval

### Event Queries

```typescript
// Get events by type
const taskEvents = eventStore.query({ type: "task-completed", limit: 10 });

// Get events by actor
const userEvents = eventStore.query({ actorId: "user-123", limit: 50 });

// Get events by time range
const recentEvents = eventStore.query({
  startTime: Date.now() - 86400000, // Last 24 hours
  endTime: Date.now(),
});

// Get event chain (causality)
const chain = eventStore.getEventChain("event-456");

// Get child events
const children = eventStore.getChildEvents("parent-event-123");
```

### Intent Queries

```typescript
// Get pending intents
const pending = intentStore.getPendingIntents();

// Get intents by state
const completed = intentStore.getIntentsByState("completed");

// Get measurable intents
const measurable = intentStore.query({ measurable: true });
```

### Hypothesis Queries

```typescript
// Get parallel hypotheses for all models
const parallel = hypothesisStore.getParallelHypotheses();

// Get active (non-falsified) hypotheses
const active = hypothesisStore.getActiveHypotheses();

// Get high-probability hypotheses
const highConf = hypothesisStore.query({ minProbability: 0.8 });
```

### Test Queries

```typescript
// Get failed tests
const failed = testStore.getFailedTests();

// Get tests for a hypothesis
const tests = testStore.getByHypothesis("hyp-123");

// Get pending tests
const pending = testStore.getPendingTests();
```

## Reproduction and Rollback

### Event Replay

Events can be replayed to reconstruct system state:

```typescript
// Export all events
const events = eventStore.exportAll();

// Sort by timestamp
events.sort((a, b) => a.timestamp - b.timestamp);

// Replay events
for (const event of events) {
  // Apply event to system
  applyEvent(event);
}
```

### Intent Rollback

Intents can be rolled back using their reversal procedures:

```typescript
const intent = intentStore.get("intent-123");
if (intent) {
  // Get associated events
  const events = intent.eventIds.map(id => eventStore.get(id));
  
  // Execute reversal procedures in reverse order
  for (const event of events.reverse()) {
    if (event.reversalProcedure) {
      executeReversal(event.reversalProcedure);
    }
  }
  
  // Update intent state
  intentStore.update(intent.id, { state: "cancelled" });
}
```

### Hypothesis Reset

Hypotheses can be reset to earlier versions:

```typescript
const hypothesis = hypothesisStore.get("hyp-123");
if (hypothesis && hypothesis.version > 1) {
  // Reset to initial state
  hypothesisStore.update(hypothesis.id, {
    probability: 0.5,
    falsifiers: hypothesis.falsifiers.map(f => ({ ...f, triggered: false })),
    evidenceEventIds: [],
    version: 1,
  });
}
```

## Testing

Comprehensive unit tests are provided for all components:

```bash
# Run HandshakeOS tests
npx vitest run src/handshakeos

# Run with coverage
npx vitest run src/handshakeos --coverage
```

Test coverage includes:
- Event storage and retrieval
- Intent lifecycle management
- Hypothesis tracking and updates
- Test object management
- Query and filtering operations
- Export and clear operations

## Future Extensions

### Persistent Storage

Currently, all stores use in-memory storage. Future implementations should:

1. Add database backends (PostgreSQL, SQLite)
2. Implement event sourcing patterns
3. Add snapshot/restore capabilities
4. Support distributed storage

### Advanced Querying

Planned query enhancements:

1. Full-text search across event payloads
2. Graph queries for event chains
3. Temporal queries (before/after/during)
4. Complex filtering with AND/OR logic

### Visualization

Future visualization tools:

1. Event timeline views
2. Hypothesis probability graphs
3. Intent lifecycle diagrams
4. Test coverage dashboards

### Integration

Integration points for OpenClaw:

1. Link events to agent actions
2. Track intent tokens for user requests
3. Generate hypotheses from usage patterns
4. Create tests for validation

## References

- **Event Sourcing**: [Martin Fowler's Event Sourcing Pattern](https://martinfowler.com/eaaDev/EventSourcing.html)
- **Hypothesis Testing**: [Karl Popper's Falsifiability Principle](https://plato.stanford.edu/entries/popper/)
- **Intent-Based Systems**: [Intent-Based Networking](https://en.wikipedia.org/wiki/Intent-based_networking)
- **Actor Model**: [Hewitt, Bishop, Steiger (1973)](https://en.wikipedia.org/wiki/Actor_model)

## Maintainer Notes

This system is designed for future maintainability:

1. **Type Safety**: All types are strictly defined in TypeScript
2. **Immutability**: Events are immutable once stored
3. **Testability**: Comprehensive test coverage
4. **Documentation**: Inline JSDoc comments
5. **Extensibility**: Pluggable storage backends
6. **Auditability**: Full audit trail for all operations

When extending this system:
- Maintain backward compatibility for types
- Add tests for new functionality
- Update documentation
- Preserve audit trail capabilities
- Keep reversal procedures up to date
