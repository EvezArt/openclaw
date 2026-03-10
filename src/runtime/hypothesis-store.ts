/**
 * HypothesisStore manages hypotheses and emits hypothesis events.
 * Used by agents like CrawFather to track and emit planning hypotheses.
 */

import { emitAgentEvent } from "../infra/agent-events.js";

export type Hypothesis = {
  id: string;
  text: string;
  status: "pending" | "active" | "completed" | "rejected";
  createdAt: number;
  updatedAt: number;
};

export type HypothesisStoreConfig = {
  runId: string;
  sessionKey: string;
};

export class HypothesisStore {
  private hypotheses = new Map<string, Hypothesis>();
  private runId: string;
  private sessionKey: string;

  constructor(config: HypothesisStoreConfig) {
    this.runId = config.runId;
    this.sessionKey = config.sessionKey;
  }

  /**
   * Add a new hypothesis and emit hypothesis.created event.
   */
  add(text: string): Hypothesis {
    const id = `hyp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const hypothesis: Hypothesis = {
      id,
      text,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.hypotheses.set(id, hypothesis);

    emitAgentEvent({
      runId: this.runId,
      stream: "lifecycle",
      data: {
        type: "hypothesis.created",
        hypothesis: {
          id: hypothesis.id,
          text: hypothesis.text,
          status: hypothesis.status,
        },
      },
      sessionKey: this.sessionKey,
    });

    return hypothesis;
  }

  /**
   * Update hypothesis status and emit hypothesis.updated event.
   */
  updateStatus(id: string, status: Hypothesis["status"]): void {
    const hypothesis = this.hypotheses.get(id);
    if (!hypothesis) {
      return;
    }

    hypothesis.status = status;
    hypothesis.updatedAt = Date.now();

    emitAgentEvent({
      runId: this.runId,
      stream: "lifecycle",
      data: {
        type: "hypothesis.updated",
        hypothesis: {
          id: hypothesis.id,
          text: hypothesis.text,
          status: hypothesis.status,
        },
      },
      sessionKey: this.sessionKey,
    });
  }

  /**
   * Get a hypothesis by ID.
   */
  get(id: string): Hypothesis | undefined {
    return this.hypotheses.get(id);
  }

  /**
   * List all hypotheses.
   */
  list(): Hypothesis[] {
    return Array.from(this.hypotheses.values());
  }

  /**
   * Clear all hypotheses.
   */
  clear(): void {
    this.hypotheses.clear();
  }
}
