/**
 * EventBus for broadcasting AgentEvents to multiple listeners.
 * Wraps the existing agent-events system from infra.
 */

import { emitAgentEvent, onAgentEvent, type AgentEventPayload } from "../infra/agent-events.js";

export type EventListener = (event: AgentEventPayload) => void;

export class EventBus {
  private listeners = new Set<EventListener>();

  /**
   * Subscribe to all agent events.
   */
  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Emit an agent event.
   */
  emit(event: Omit<AgentEventPayload, "seq" | "ts">): void {
    emitAgentEvent(event);
  }

  /**
   * Get the number of active listeners.
   */
  get listenerCount(): number {
    return this.listeners.size;
  }

  /**
   * Clear all listeners (for testing).
   */
  clear(): void {
    this.listeners.clear();
  }
}

/**
 * Global event bus instance.
 */
export const globalEventBus = new EventBus();

/**
 * Wire the global event bus to the infra event system.
 */
onAgentEvent((event) => {
  for (const listener of globalEventBus["listeners"]) {
    try {
      listener(event);
    } catch {
      /* ignore */
    }
  }
});
