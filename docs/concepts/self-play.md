---
summary: "Self play daemon architecture, checkpoints, and browser observe override flow"
read_when:
  - You need a self play runtime that keeps running without a browser session
  - You want checkpoint tokens and event replay across devices
  - You want clear boundaries between game authority and player actions
---

# Self play daemon architecture

This document defines a minimal, production shaped runtime where simulation continues even when no
browser is connected. Clients can observe, submit overrides, disconnect, and later resync from a
checkpoint token.

## What this mode means

Self play mode makes the daemon the authoritative game runtime.

- The world advances on schedule with no active player session.
- Canonical state is derived from events, not client memory.
- Any client can resume from a checkpoint and replay to latest.
- Player overrides remain possible but are audited through the same log.

## Core services

### Agent runtime environment

- Spawns agents and runs `tick(agent, worldState)` on a fixed cadence.
- Emits decisions as events instead of mutating state directly.
- Uses the same runtime contract for all agents.

### Game logic module

- Evaluates decisions and advances simulation.
- Emits success and failure outcomes plus side effects.

### Event store

- Immutable append only log keyed by stream and position.
- Source of truth for replay, projection rebuilds, and audits.

### Checkpoint manager

- Snapshots projection state every N events or M minutes.
- Issues checkpoint tokens with checksum and expiry metadata.

### Verification engine

- Computes playerhood signals from agency, continuity, and accountability.
- Runs continuously, independent of client connectivity.

### Continuity tracker

- Tracks lineage, recovery quality, and anomaly signals.

## Client model

### Browser observe override client

- Subscribes to live event streams via WebSocket or SSE.
- Reads projections and submits command overrides.
- Stores latest checkpoint token locally.
- On reconnect, sends token and replays from `position + 1`.

### Offline behavior

- Disconnecting clients does not pause world progression.
- Returning clients catch up through replay.

## Event choreography

All state changes flow through events.

```
Agent runtime -> Event store -> subscribers
  -> game logic
  -> verification engine
  -> checkpoint manager
  -> projections
  -> client streams
```

## What the game can do that players cannot

The daemon owns system level authority that should not depend on player presence.

- Keep tick cadence stable during reconnect churn.
- Rebuild projections after corruption or schema migration.
- Detect continuity anomalies and mark suspect sessions.
- Enforce global rate limits and command conflict rules.

Players still control intent via commands and overrides, but canonical state is daemon owned.

## Win conditions

A deployment is considered winning when all conditions hold for a sustained window.

- **Autonomy**: world and agent streams progress for at least 24 hours without browser clients.
- **Recoverability**: checkpoint resume catches up with zero missing positions.
- **Determinism**: replaying the same range yields the same projection result.
- **Safety**: verification and continuity checks flag anomalies without halting healthy streams.
- **Override control**: player overrides are accepted and auditable in the canonical log.

## Storage choices

### MVP

- Event store: SQLite with `(streamId, position)` uniqueness.
- Checkpoints: JSON snapshots or Redis.
- Identity registry: SQLite.

### Scale path

- Event store: Kafka, EventStoreDB, or partitioned Postgres.
- Checkpoints: Redis cluster.

## Self play loop

Run the loop on fixed intervals. Example ranges: 2 to 10 seconds for simulation ticks, 30 to 120
seconds for planning ticks.

1. Load world projection for the relevant region.
2. Collect observations and new events since last cursor.
3. Call `tick(agent, worldState)` to produce decisions.
4. Append `agent.action.submitted` events.
5. Evaluate decisions in game logic and emit outcomes.
6. Update verification and continuity signals.
7. Snapshot checkpoints per policy.
8. Broadcast events to connected clients.

## Checkpoint token schema

Use a portable token structure for resume and validation.

- `version`
- `agentId`
- `checkpointId`
- `position`
- `checksum`
- `issuedAt`
- `expiresAt`

On sync, validate checksum and replay events from `position + 1`.

## Minimal API surface

- `POST /command` submit decision or override
- `GET /checkpoint/latest?streamId=agent:<id>`
- `GET /sync?token=<CheckpointToken>`
- `WS /stream?streamId=world:<region>`
- `GET /projection/<name>`

## Capability boundaries

The daemon only acts through installed capability plugins. The game remains playable with whatever
capabilities are currently available.

Example capability contracts:

- `cap.read_public(url)`
- `cap.read_authenticated(service, scope)`
- `cap.post(service, content)`
- `cap.store(blob)`
- `cap.hash(blob)`
- `cap.notify(message)`

## First shipping scope

Keep the first release small and winnable.

- Start with daemon plus one web observe override client.
- Use SQLite event log and JSON checkpoints.
- Ship replay, checkpoint validation, and one projection.
- Add authenticated capability plugins after base loop stability is proven.

## Non goals for v1

- Multi region distributed consensus.
- Cross region exactly once guarantees.
- Full automation across external authenticated services.

## Browser only variant

A browser only variant can run the same loop with IndexedDB as the event log and checkpoint
tokens for transfer. It is useful for local prototyping, and can later sync with the daemon
without changing core contracts.

## Related concepts

- [Agent loop](/concepts/agent-loop)
- [Gateway architecture](/concepts/architecture)
