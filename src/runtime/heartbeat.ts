/**
 * Periodic heartbeat system for always-on agents.
 * Emits heartbeat events at regular intervals.
 */

import { emitAgentEvent } from "../infra/agent-events.js";

export type HeartbeatConfig = {
  intervalMs: number;
  sessionKey: string;
  runId: string;
};

export type HeartbeatHandle = {
  stop: () => void;
};

/**
 * Start a periodic heartbeat that emits system.heartbeat events.
 */
export function startHeartbeat(config: HeartbeatConfig): HeartbeatHandle {
  const timer = setInterval(() => {
    emitAgentEvent({
      runId: config.runId,
      stream: "lifecycle",
      data: {
        type: "system.heartbeat",
        ts: Date.now(),
      },
      sessionKey: config.sessionKey,
    });
  }, config.intervalMs);

  return {
    stop: () => clearInterval(timer),
  };
}
