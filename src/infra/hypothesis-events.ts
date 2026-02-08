/**
 * Hypothesis Events for Parallel Hypothesis Tracking
 *
 * Integrates HandshakeOS-E hypothesis system with agent event streams.
 * Tracks multiple competing thoughts per runId with seq-ordering.
 */

import type { Hypothesis, HypothesisModelType } from "../handshakeos/types.js";
import { emitAgentEvent, onAgentEvent } from "./agent-events.js";

/**
 * Hypothesis event data for agent event stream.
 */
export type HypothesisEventData = {
  /** Hypothesis unique ID */
  hypothesisId: string;
  /** Model type: me/we/they/system */
  modelType: HypothesisModelType;
  /** Hypothesis description/thought */
  description: string;
  /** Probability (0-1) */
  probability: number;
  /** Event phase: created, updated, falsified, selected */
  phase: "created" | "updated" | "falsified" | "selected";
  /** Optional: which falsifier was triggered */
  falsifierIndex?: number;
  /** Timestamp when hypothesis was created */
  createdAt: number;
  /** Version number */
  version: number;
};

/**
 * Parallel hypotheses for a run.
 */
export type ParallelHypotheses = {
  runId: string;
  hypotheses: Map<string, HypothesisEventData>;
  selectedId?: string;
  lastSeq: number;
};

// Track hypotheses per run
const hypothesesByRun = new Map<string, ParallelHypotheses>();

/**
 * Emit a hypothesis event on the agent event stream.
 */
export function emitHypothesisEvent(runId: string, data: HypothesisEventData) {
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    data: {
      hypothesisId: data.hypothesisId,
      modelType: data.modelType,
      description: data.description,
      probability: data.probability,
      phase: data.phase,
      falsifierIndex: data.falsifierIndex,
      createdAt: data.createdAt,
      version: data.version,
    },
  });

  // Track locally for queries
  let parallel = hypothesesByRun.get(runId);
  if (!parallel) {
    parallel = {
      runId,
      hypotheses: new Map(),
      lastSeq: 0,
    };
    hypothesesByRun.set(runId, parallel);
  }

  parallel.hypotheses.set(data.hypothesisId, data);
  parallel.lastSeq++;

  if (data.phase === "selected") {
    parallel.selectedId = data.hypothesisId;
  }

  // Cleanup old runs (keep last 100)
  if (hypothesesByRun.size > 100) {
    const oldestKeys = Array.from(hypothesesByRun.keys()).slice(0, 10);
    for (const key of oldestKeys) {
      hypothesesByRun.delete(key);
    }
  }
}

/**
 * Create and emit a new hypothesis for a run.
 */
export function createHypothesis(
  runId: string,
  modelType: HypothesisModelType,
  description: string,
  probability: number,
): string {
  const hypothesisId = `${runId}-${modelType}-${Date.now()}`;
  const data: HypothesisEventData = {
    hypothesisId,
    modelType,
    description,
    probability,
    phase: "created",
    createdAt: Date.now(),
    version: 1,
  };
  emitHypothesisEvent(runId, data);
  return hypothesisId;
}

/**
 * Update an existing hypothesis probability.
 */
export function updateHypothesis(
  runId: string,
  hypothesisId: string,
  probability: number,
) {
  const parallel = hypothesesByRun.get(runId);
  if (!parallel) {
    return;
  }

  const existing = parallel.hypotheses.get(hypothesisId);
  if (!existing) {
    return;
  }

  const updated: HypothesisEventData = {
    ...existing,
    probability,
    phase: "updated",
    version: existing.version + 1,
  };

  emitHypothesisEvent(runId, updated);
}

/**
 * Mark a hypothesis as falsified.
 */
export function falsifyHypothesis(
  runId: string,
  hypothesisId: string,
  falsifierIndex: number,
) {
  const parallel = hypothesesByRun.get(runId);
  if (!parallel) {
    return;
  }

  const existing = parallel.hypotheses.get(hypothesisId);
  if (!existing) {
    return;
  }

  const falsified: HypothesisEventData = {
    ...existing,
    phase: "falsified",
    falsifierIndex,
    version: existing.version + 1,
  };

  emitHypothesisEvent(runId, falsified);
}

/**
 * Select a hypothesis as the winning thought.
 */
export function selectHypothesis(runId: string, hypothesisId: string) {
  const parallel = hypothesesByRun.get(runId);
  if (!parallel) {
    return;
  }

  const existing = parallel.hypotheses.get(hypothesisId);
  if (!existing) {
    return;
  }

  const selected: HypothesisEventData = {
    ...existing,
    phase: "selected",
    version: existing.version + 1,
  };

  emitHypothesisEvent(runId, selected);
}

/**
 * Get all hypotheses for a run.
 */
export function getRunHypotheses(runId: string): HypothesisEventData[] {
  const parallel = hypothesesByRun.get(runId);
  if (!parallel) {
    return [];
  }
  return Array.from(parallel.hypotheses.values());
}

/**
 * Get the selected hypothesis for a run.
 */
export function getSelectedHypothesis(runId: string): HypothesisEventData | undefined {
  const parallel = hypothesesByRun.get(runId);
  if (!parallel || !parallel.selectedId) {
    return undefined;
  }
  return parallel.hypotheses.get(parallel.selectedId);
}

/**
 * Get hypotheses grouped by model type.
 */
export function getHypothesesByModelType(
  runId: string,
): Record<HypothesisModelType, HypothesisEventData[]> {
  const all = getRunHypotheses(runId);
  const grouped: Record<HypothesisModelType, HypothesisEventData[]> = {
    me: [],
    we: [],
    they: [],
    system: [],
  };

  for (const hyp of all) {
    grouped[hyp.modelType].push(hyp);
  }

  return grouped;
}

/**
 * Clear hypotheses for a run (cleanup).
 */
export function clearRunHypotheses(runId: string) {
  hypothesesByRun.delete(runId);
}

/**
 * Subscribe to hypothesis events.
 * Returns unsubscribe function.
 */
export function onHypothesisEvent(
  handler: (runId: string, data: HypothesisEventData) => void,
): () => void {
  return onAgentEvent((evt) => {
    if (evt.stream === "hypothesis" && evt.data) {
      const data = evt.data as HypothesisEventData;
      handler(evt.runId, data);
    }
  });
}

/**
 * Clear all hypotheses (for testing).
 */
export function clearAllHypothesesForTest() {
  hypothesesByRun.clear();
}
