/**
 * CrawFather Survival Pack: Hypothesis tracker
 *
 * This module tracks parallel hypotheses across CrawFather runs,
 * managing hypothesis lifecycle (created/updated/evidence/resolved)
 * and maintaining run state (runId/sessionKey/seq/ts).
 */

import type {
  CrawFatherRun,
  Hypothesis,
  HypothesisEvent,
  HypothesisOutcome,
  HypothesisStatus,
} from "./hypothesis-types.js";

export class HypothesisTracker {
  private runs = new Map<string, CrawFatherRun>();

  /**
   * Process a hypothesis event from the agent event stream.
   * Events are expected to arrive on the "hypothesis" stream with data containing:
   * - kind: created | updated | evidence | resolved
   * - hypothesisId: unique identifier for the hypothesis
   * - Additional fields depending on kind (description, score, status, outcome, evidence)
   */
  processEvent(event: HypothesisEvent): void {
    const { runId, hypothesisId, kind, timestamp, data = {} } = event;

    // Ensure run exists
    let run = this.runs.get(runId);
    if (!run) {
      run = {
        runId,
        sessionKey: "",
        startedAt: timestamp,
        lastSeq: 0,
        lastTs: timestamp,
        hypotheses: new Map(),
      };
      this.runs.set(runId, run);
    }

    // Update run timestamp
    run.lastTs = timestamp;

    switch (kind) {
      case "created": {
        const hypothesis: Hypothesis = {
          id: hypothesisId,
          runId,
          description: data.description ?? "",
          score: data.score ?? 0,
          status: data.status ?? "active",
          outcome: null,
          createdAt: timestamp,
          updatedAt: timestamp,
          evidence: [],
        };
        run.hypotheses.set(hypothesisId, hypothesis);
        break;
      }

      case "updated": {
        const hypothesis = run.hypotheses.get(hypothesisId);
        if (hypothesis) {
          if (data.description !== undefined) {
            hypothesis.description = data.description;
          }
          if (data.score !== undefined) {
            hypothesis.score = data.score;
          }
          if (data.status !== undefined) {
            hypothesis.status = data.status as HypothesisStatus;
          }
          hypothesis.updatedAt = timestamp;
        }
        break;
      }

      case "evidence": {
        const hypothesis = run.hypotheses.get(hypothesisId);
        if (hypothesis && data.evidence) {
          hypothesis.evidence.push(data.evidence);
          hypothesis.updatedAt = timestamp;
        }
        break;
      }

      case "resolved": {
        const hypothesis = run.hypotheses.get(hypothesisId);
        if (hypothesis) {
          hypothesis.status = "resolved";
          hypothesis.outcome = (data.outcome as HypothesisOutcome) ?? null;
          hypothesis.updatedAt = timestamp;
        }
        break;
      }

      default: {
        // Exhaustive match guard
        const _exhaustive: never = kind;
        return _exhaustive;
      }
    }
  }

  /**
   * Get all hypotheses for a specific run.
   */
  getRunHypotheses(runId: string): Hypothesis[] {
    const run = this.runs.get(runId);
    if (!run) {
      return [];
    }
    return Array.from(run.hypotheses.values());
  }

  /**
   * Get a specific hypothesis by ID within a run.
   */
  getHypothesis(runId: string, hypothesisId: string): Hypothesis | null {
    const run = this.runs.get(runId);
    if (!run) {
      return null;
    }
    return run.hypotheses.get(hypothesisId) ?? null;
  }

  /**
   * Update session key for a run (e.g., from agent event context).
   */
  setRunSessionKey(runId: string, sessionKey: string): void {
    const run = this.runs.get(runId);
    if (run) {
      run.sessionKey = sessionKey;
    }
  }

  /**
   * Clear tracking data for a run (e.g., when run completes).
   */
  clearRun(runId: string): void {
    this.runs.delete(runId);
  }

  /**
   * Prune old runs to prevent unbounded memory growth.
   * Keeps runs from the last 10 minutes, up to a max of 200 runs.
   */
  pruneOldRuns(): void {
    if (this.runs.size <= 200) {
      return;
    }

    const keepUntil = Date.now() - 10 * 60 * 1000;
    const toDelete: string[] = [];

    for (const [runId, run] of this.runs) {
      if (this.runs.size - toDelete.length <= 150) {
        break;
      }
      if (run.lastTs < keepUntil) {
        toDelete.push(runId);
      }
    }

    for (const runId of toDelete) {
      this.runs.delete(runId);
    }

    // If still over limit, remove oldest runs
    if (this.runs.size > 200) {
      const sorted = Array.from(this.runs.entries()).toSorted((a, b) => a[1].lastTs - b[1].lastTs);
      const removeCount = this.runs.size - 150;
      for (let i = 0; i < removeCount && i < sorted.length; i++) {
        this.runs.delete(sorted[i][0]);
      }
    }
  }
}
