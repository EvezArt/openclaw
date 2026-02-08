/**
 * CrawFather Survival Pack: Hypothesis tracking types
 *
 * This module defines the data structures for tracking parallel hypotheses
 * in CrawFather runs, including hypothesis status, evidence, and outcomes.
 */

export type HypothesisStatus = "active" | "stale" | "resolved";

export type HypothesisOutcome = "accepted" | "rejected" | "abandoned" | null;

export type HypothesisEventKind = "created" | "updated" | "evidence" | "resolved";

export type HypothesisEvidence = {
  description: string;
  weight: number;
  timestamp: number;
};

export type Hypothesis = {
  id: string;
  runId: string;
  description: string;
  score: number;
  status: HypothesisStatus;
  outcome: HypothesisOutcome;
  createdAt: number;
  updatedAt: number;
  evidence: HypothesisEvidence[];
};

export type HypothesisEvent = {
  kind: HypothesisEventKind;
  hypothesisId: string;
  runId: string;
  timestamp: number;
  data?: {
    description?: string;
    score?: number;
    status?: HypothesisStatus;
    outcome?: HypothesisOutcome;
    evidence?: HypothesisEvidence;
  };
};

/**
 * CrawFather run tracking - maintains runId, sessionKey, seq, and ts
 * for system/heartbeat/hypothesis/error events.
 */
export type CrawFatherRun = {
  runId: string;
  sessionKey: string;
  startedAt: number;
  lastSeq: number;
  lastTs: number;
  hypotheses: Map<string, Hypothesis>;
};
