/**
 * Example: How to emit hypothesis events for CrawFather Survival Pack
 *
 * This example demonstrates how to emit hypothesis events that will be
 * tracked and rendered in the OpenClaw TUI "Thinking (parallel hypotheses)" panel.
 */

import { emitAgentEvent } from "../infra/agent-events.js";

/**
 * Example: Emit hypothesis events during a CrawFather run
 */
export function exampleCrawFatherRun(runId: string, sessionKey: string) {
  // 1. Create initial hypotheses
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "created",
      hypothesisId: "h1",
      timestamp: Date.now(),
      description: "User wants to list files in current directory",
      score: 0.75,
      status: "active",
    },
  });

  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "created",
      hypothesisId: "h2",
      timestamp: Date.now(),
      description: "User wants to search for specific file pattern",
      score: 0.6,
      status: "active",
    },
  });

  // 2. Add evidence to a hypothesis
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "evidence",
      hypothesisId: "h1",
      timestamp: Date.now(),
      evidence: {
        description: "User mentioned 'ls' command",
        weight: 0.8,
        timestamp: Date.now(),
      },
    },
  });

  // 3. Update hypothesis score based on new information
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "updated",
      hypothesisId: "h1",
      timestamp: Date.now(),
      score: 0.9,
    },
  });

  // 4. Mark another hypothesis as stale
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "updated",
      hypothesisId: "h2",
      timestamp: Date.now(),
      status: "stale",
    },
  });

  // 5. Resolve the primary hypothesis
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "resolved",
      hypothesisId: "h1",
      timestamp: Date.now(),
      outcome: "accepted",
    },
  });

  // 6. Emit system/heartbeat events (tracked but not rendered in panel)
  emitAgentEvent({
    runId,
    stream: "system",
    sessionKey,
    data: {
      phase: "start",
      timestamp: Date.now(),
    },
  });

  emitAgentEvent({
    runId,
    stream: "heartbeat",
    sessionKey,
    data: {
      timestamp: Date.now(),
      status: "active",
    },
  });
}

/**
 * Example: Multiple parallel hypotheses being evaluated simultaneously
 */
export function exampleParallelHypotheses(runId: string, sessionKey: string) {
  // Create multiple competing hypotheses
  const hypotheses = [
    {
      id: "h1",
      description: "User wants to install a package",
      score: 0.7,
    },
    {
      id: "h2",
      description: "User wants to update existing packages",
      score: 0.65,
    },
    {
      id: "h3",
      description: "User wants to remove a package",
      score: 0.5,
    },
  ];

  // Create all hypotheses
  for (const h of hypotheses) {
    emitAgentEvent({
      runId,
      stream: "hypothesis",
      sessionKey,
      data: {
        kind: "created",
        hypothesisId: h.id,
        timestamp: Date.now(),
        description: h.description,
        score: h.score,
        status: "active",
      },
    });
  }

  // Add evidence to different hypotheses
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "evidence",
      hypothesisId: "h1",
      timestamp: Date.now(),
      evidence: {
        description: "Found 'npm install' in user message",
        weight: 0.9,
        timestamp: Date.now(),
      },
    },
  });

  // Update scores based on evidence
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "updated",
      hypothesisId: "h1",
      timestamp: Date.now(),
      score: 0.95,
    },
  });

  // Mark other hypotheses as stale
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "updated",
      hypothesisId: "h2",
      timestamp: Date.now(),
      status: "stale",
    },
  });

  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "updated",
      hypothesisId: "h3",
      timestamp: Date.now(),
      status: "stale",
    },
  });

  // Resolve the winning hypothesis
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "resolved",
      hypothesisId: "h1",
      timestamp: Date.now(),
      outcome: "accepted",
    },
  });

  // Resolve the other hypotheses as abandoned
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "resolved",
      hypothesisId: "h2",
      timestamp: Date.now(),
      outcome: "abandoned",
    },
  });

  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "resolved",
      hypothesisId: "h3",
      timestamp: Date.now(),
      outcome: "abandoned",
    },
  });
}

/**
 * Example: Hypothesis rejection scenario
 */
export function exampleHypothesisRejection(runId: string, sessionKey: string) {
  // Create a hypothesis
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "created",
      hypothesisId: "h1",
      timestamp: Date.now(),
      description: "User wants to delete all files",
      score: 0.6,
      status: "active",
    },
  });

  // Add contradicting evidence
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "evidence",
      hypothesisId: "h1",
      timestamp: Date.now(),
      evidence: {
        description: "User explicitly said 'not all files'",
        weight: 0.95,
        timestamp: Date.now(),
      },
    },
  });

  // Update score downward
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "updated",
      hypothesisId: "h1",
      timestamp: Date.now(),
      score: 0.2,
    },
  });

  // Reject the hypothesis
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: {
      kind: "resolved",
      hypothesisId: "h1",
      timestamp: Date.now(),
      outcome: "rejected",
    },
  });
}
