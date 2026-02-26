import type { VerboseLevel } from "../auto-reply/thinking.js";

export type AgentEventStream =
  | "lifecycle"
  | "tool"
  | "assistant"
  | "error"
  | "system"
  | "heartbeat.run"
  | "hypothesis"
  | (string & {});

export type AgentEventPayload = {
  runId: string;
  seq: number;
  stream: AgentEventStream;
  ts: number;
  data: Record<string, unknown>;
  sessionKey?: string;
};

// System event subtypes for CrawFather agent lifecycle
export type SystemEventSubtype = "run_started" | "run_completed" | "run_failed";

// Hypothesis event subtypes for parallel thinking tracking
export type HypothesisEventSubtype = "created" | "updated" | "evidence" | "resolved";

// Hypothesis data payload structure
export type HypothesisEventData = {
  subtype: HypothesisEventSubtype;
  hypothesisId: string;
  hypothesis?: string;
  score?: number; // 0-1 confidence score
  status?: "active" | "resolved" | "rejected";
  outcome?: "confirmed" | "rejected" | "merged";
  reason?: string;
  evidence?: string;
  timestamp?: number;
};

export type AgentRunContext = {
  sessionKey?: string;
  verboseLevel?: VerboseLevel;
  isHeartbeat?: boolean;
};

// Keep per-run counters so streams stay strictly monotonic per runId.
const seqByRun = new Map<string, number>();
const listeners = new Set<(evt: AgentEventPayload) => void>();
const runContextById = new Map<string, AgentRunContext>();

export function registerAgentRunContext(runId: string, context: AgentRunContext) {
  if (!runId) {
    return;
  }
  const existing = runContextById.get(runId);
  if (!existing) {
    runContextById.set(runId, { ...context });
    return;
  }
  if (context.sessionKey && existing.sessionKey !== context.sessionKey) {
    existing.sessionKey = context.sessionKey;
  }
  if (context.verboseLevel && existing.verboseLevel !== context.verboseLevel) {
    existing.verboseLevel = context.verboseLevel;
  }
  if (context.isHeartbeat !== undefined && existing.isHeartbeat !== context.isHeartbeat) {
    existing.isHeartbeat = context.isHeartbeat;
  }
}

export function getAgentRunContext(runId: string) {
  return runContextById.get(runId);
}

export function clearAgentRunContext(runId: string) {
  runContextById.delete(runId);
}

export function resetAgentRunContextForTest() {
  runContextById.clear();
}

export function emitAgentEvent(event: Omit<AgentEventPayload, "seq" | "ts">) {
  const nextSeq = (seqByRun.get(event.runId) ?? 0) + 1;
  seqByRun.set(event.runId, nextSeq);
  const context = runContextById.get(event.runId);
  const sessionKey =
    typeof event.sessionKey === "string" && event.sessionKey.trim()
      ? event.sessionKey
      : context?.sessionKey;
  const enriched: AgentEventPayload = {
    ...event,
    sessionKey,
    seq: nextSeq,
    ts: Date.now(),
  };
  for (const listener of listeners) {
    try {
      listener(enriched);
    } catch {
      /* ignore */
    }
  }
}

export function onAgentEvent(listener: (evt: AgentEventPayload) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Convenience helpers for emitting specific event types

export function emitSystemEvent(
  runId: string,
  subtype: SystemEventSubtype,
  data?: Record<string, unknown>,
  sessionKey?: string,
) {
  emitAgentEvent({
    runId,
    stream: "system",
    sessionKey,
    data: { subtype, ...data },
  });
}

export function emitHypothesisEvent(
  runId: string,
  hypothesisData: HypothesisEventData,
  sessionKey?: string,
) {
  emitAgentEvent({
    runId,
    stream: "hypothesis",
    sessionKey,
    data: hypothesisData as Record<string, unknown>,
  });
}

export function emitHeartbeatRunEvent(
  runId: string,
  data: Record<string, unknown>,
  sessionKey?: string,
) {
  emitAgentEvent({
    runId,
    stream: "heartbeat.run",
    sessionKey,
    data,
  });
}
