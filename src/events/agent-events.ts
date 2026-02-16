/**
 * Extended AgentEvent types for the nervous system.
 * Builds on top of existing AgentEventPayload from infra/agent-events.ts
 */

export type SystemEventType =
  | "system.run_started"
  | "system.run_completed"
  | "system.run_failed"
  | "system.heartbeat";

export type HypothesisEventType = "hypothesis.created" | "hypothesis.updated";

export type ChatEventType = "chat.message" | "chat.delta" | "chat.final";

export type ErrorEventType = "error.runtime" | "error.validation";

export type AgentEventType = SystemEventType | HypothesisEventType | ChatEventType | ErrorEventType;

/**
 * System event data
 */
export type SystemEventData = {
  type: SystemEventType;
  ts: number;
  message?: string;
  error?: string;
};

/**
 * Hypothesis event data
 */
export type HypothesisEventData = {
  type: HypothesisEventType;
  hypothesis: {
    id: string;
    text: string;
    status: "pending" | "active" | "completed" | "rejected";
  };
};

/**
 * Chat event data
 */
export type ChatEventData = {
  type: ChatEventType;
  message?: string;
  delta?: string;
};

/**
 * Error event data
 */
export type ErrorEventData = {
  type: ErrorEventType;
  error: string;
  stack?: string;
};

export type AgentEventData = SystemEventData | HypothesisEventData | ChatEventData | ErrorEventData;
