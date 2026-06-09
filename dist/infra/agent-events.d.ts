import type { VerboseLevel } from "../auto-reply/thinking.js";
export type AgentEventStream = "lifecycle" | "tool" | "assistant" | "error" | "system" | "heartbeat.run" | "hypothesis" | (string & {});
export type AgentEventPayload = {
    runId: string;
    seq: number;
    stream: AgentEventStream;
    ts: number;
    data: Record<string, unknown>;
    sessionKey?: string;
};
export type SystemEventSubtype = "run_started" | "run_completed" | "run_failed";
export type HypothesisEventSubtype = "created" | "updated" | "evidence" | "resolved";
export type HypothesisEventData = {
    subtype: HypothesisEventSubtype;
    hypothesisId: string;
    hypothesis?: string;
    score?: number;
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
export declare function registerAgentRunContext(runId: string, context: AgentRunContext): void;
export declare function getAgentRunContext(runId: string): AgentRunContext | undefined;
export declare function clearAgentRunContext(runId: string): void;
export declare function resetAgentRunContextForTest(): void;
export declare function emitAgentEvent(event: Omit<AgentEventPayload, "seq" | "ts">): void;
export declare function onAgentEvent(listener: (evt: AgentEventPayload) => void): () => boolean;
export declare function emitSystemEvent(runId: string, subtype: SystemEventSubtype, data?: Record<string, unknown>, sessionKey?: string): void;
export declare function emitHypothesisEvent(runId: string, hypothesisData: HypothesisEventData, sessionKey?: string): void;
export declare function emitHeartbeatRunEvent(runId: string, data: Record<string, unknown>, sessionKey?: string): void;
