/**
 * CrawFather: Always-on planning and hypothesis generation agent.
 * Emits system and hypothesis events for UI consumption.
 */

import { emitAgentEvent, registerAgentRunContext } from "../infra/agent-events.js";
import { RunRegistry } from "../runtime/run-context.js";
import { HypothesisStore } from "../runtime/hypothesis-store.js";

export type CrawFatherConfig = {
  sessionKey?: string;
  hypothesisCount?: number;
  delayMs?: number;
};

const DEFAULT_SESSION_KEY = "agent:crawfather:main";
const DEFAULT_HYPOTHESIS_COUNT = 5;
const DEFAULT_DELAY_MS = 1000;

/**
 * Run CrawFather agent: emit system.run_started, generate hypotheses, emit system.run_completed.
 */
export async function runCrawFather(config: CrawFatherConfig = {}): Promise<string> {
  const sessionKey = config.sessionKey ?? DEFAULT_SESSION_KEY;
  const hypothesisCount = config.hypothesisCount ?? DEFAULT_HYPOTHESIS_COUNT;
  const delayMs = config.delayMs ?? DEFAULT_DELAY_MS;

  const registry = new RunRegistry();
  const runContext = registry.register(sessionKey);
  const { runId } = runContext;

  // Register run context for event enrichment
  registerAgentRunContext(runId, { sessionKey });

  try {
    // Emit run_started
    emitAgentEvent({
      runId,
      stream: "lifecycle",
      data: {
        type: "system.run_started",
        ts: Date.now(),
        message: "CrawFather planning cycle started",
      },
      sessionKey,
    });

    // Create hypothesis store
    const hypothesisStore = new HypothesisStore({ runId, sessionKey });

    // Generate placeholder hypotheses
    const hypotheses = [];
    for (let i = 0; i < hypothesisCount; i++) {
      await sleep(delayMs);
      const hypothesis = hypothesisStore.add(
        `Hypothesis ${i + 1}: Evaluate system state and plan next action`,
      );
      hypotheses.push(hypothesis);
    }

    // Update hypotheses to active/completed
    for (const hypothesis of hypotheses) {
      await sleep(delayMs);
      hypothesisStore.updateStatus(hypothesis.id, "active");
      await sleep(delayMs);
      hypothesisStore.updateStatus(hypothesis.id, "completed");
    }

    // Emit run_completed
    emitAgentEvent({
      runId,
      stream: "lifecycle",
      data: {
        type: "system.run_completed",
        ts: Date.now(),
        message: "CrawFather planning cycle completed",
      },
      sessionKey,
    });

    return runId;
  } catch (error) {
    // Emit run_failed
    emitAgentEvent({
      runId,
      stream: "error",
      data: {
        type: "system.run_failed",
        ts: Date.now(),
        error: String(error),
      },
      sessionKey,
    });
    throw error;
  } finally {
    registry.remove(runId);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
