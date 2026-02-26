# OpenClaw Examples

This directory contains example code demonstrating various OpenClaw features.

## CrawFather Event Emission

**File:** `crawfather-events.ts`

Demonstrates how to emit CrawFather agent events for parallel hypothesis tracking during an agent run.

**Run:**
```bash
node --import tsx examples/crawfather-events.ts
```

**Features demonstrated:**
- System event emission (run_started, run_completed, run_failed)
- Hypothesis lifecycle (created → updated → resolved)
- Heartbeat events for long-running operations
- Event subscription and logging

**Output:**
```
CrawFather Event Emission Example
==================================

Starting CrawFather run...
[2026-02-08T22:05:00.000Z] system (seq: 1): { subtype: 'run_started', ... }
Creating hypotheses...
[2026-02-08T22:05:00.500Z] hypothesis (seq: 2): { subtype: 'created', ... }
Gathering evidence...
Resolving hypotheses...
Run completed successfully!
[2026-02-08T22:05:03.000Z] system (seq: 8): { subtype: 'run_completed', ... }

Example complete!
```

## More Examples

Additional examples coming soon! Check the [documentation](https://docs.openclaw.ai) for more guides.
