/**
 * HandshakeOS-E Intent Token Store
 *
 * Manages IntentTokens capturing goal/constraints/success metrics (pre-action)
 * and trigger/state/policy/payoff (post-event).
 */

import type { ActorIdentity, IntentToken } from "./types.js";

/**
 * Query options for retrieving intent tokens.
 */
export type IntentQuery = {
  /** Filter by actor ID */
  actorId?: string;
  /** Filter by state */
  state?: IntentToken["state"];
  /** Filter by measurability */
  measurable?: boolean;
  /** Start timestamp (inclusive) */
  startTime?: number;
  /** End timestamp (inclusive) */
  endTime?: number;
  /** Maximum number of results */
  limit?: number;
  /** Skip first N results */
  offset?: number;
};

/**
 * In-memory intent token store for MVP implementation.
 */
class IntentStore {
  private intents: Map<string, IntentToken> = new Map();
  private intentsByActor: Map<string, Set<string>> = new Map();
  private intentsByState: Map<string, Set<string>> = new Map();

  /**
   * Store a new intent token.
   */
  store(intent: IntentToken): void {
    if (this.intents.has(intent.id)) {
      throw new Error(`Intent with ID ${intent.id} already exists`);
    }

    this.intents.set(intent.id, intent);

    // Index by actor
    if (!this.intentsByActor.has(intent.actor.id)) {
      this.intentsByActor.set(intent.actor.id, new Set());
    }
    this.intentsByActor.get(intent.actor.id)!.add(intent.id);

    // Index by state
    if (intent.state) {
      if (!this.intentsByState.has(intent.state)) {
        this.intentsByState.set(intent.state, new Set());
      }
      this.intentsByState.get(intent.state)!.add(intent.id);
    }
  }

  /**
   * Update an existing intent token.
   */
  update(id: string, updates: Partial<IntentToken>): IntentToken | undefined {
    const existing = this.intents.get(id);
    if (!existing) {
      return undefined;
    }

    // Remove from old state index
    if (existing.state) {
      this.intentsByState.get(existing.state)?.delete(id);
    }

    const updated: IntentToken = { ...existing, ...updates };
    this.intents.set(id, updated);

    // Add to new state index
    if (updated.state) {
      if (!this.intentsByState.has(updated.state)) {
        this.intentsByState.set(updated.state, new Set());
      }
      this.intentsByState.get(updated.state)!.add(id);
    }

    return updated;
  }

  /**
   * Retrieve an intent by ID.
   */
  get(id: string): IntentToken | undefined {
    return this.intents.get(id);
  }

  /**
   * Query intents based on criteria.
   */
  query(options: IntentQuery = {}): IntentToken[] {
    let candidateIds: Set<string> | undefined;

    // Start with most selective index
    if (options.actorId) {
      candidateIds = this.intentsByActor.get(options.actorId);
    } else if (options.state) {
      candidateIds = this.intentsByState.get(options.state);
    }

    // If no index matched, use all intents
    if (!candidateIds) {
      candidateIds = new Set(this.intents.keys());
    }

    // Filter candidates
    let results: IntentToken[] = [];
    for (const id of candidateIds) {
      const intent = this.intents.get(id);
      if (!intent) {
        continue;
      }

      // Apply filters
      if (options.actorId && intent.actor.id !== options.actorId) {
        continue;
      }
      if (options.state && intent.state !== options.state) {
        continue;
      }
      if (options.measurable !== undefined && intent.measurable !== options.measurable) {
        continue;
      }
      if (options.startTime && intent.timestamp < options.startTime) {
        continue;
      }
      if (options.endTime && intent.timestamp > options.endTime) {
        continue;
      }

      results.push(intent);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    if (options.offset) {
      results = results.slice(options.offset);
    }
    if (options.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Get intents by actor.
   */
  getIntentsByActor(actor: ActorIdentity, limit?: number): IntentToken[] {
    return this.query({ actorId: actor.id, limit });
  }

  /**
   * Get intents by state.
   */
  getIntentsByState(state: IntentToken["state"], limit?: number): IntentToken[] {
    return this.query({ state, limit });
  }

  /**
   * Get pending intents.
   */
  getPendingIntents(limit?: number): IntentToken[] {
    return this.query({ state: "pending", limit });
  }

  /**
   * Count total intents.
   */
  count(): number {
    return this.intents.size;
  }

  /**
   * Clear all intents (for testing).
   */
  clear(): void {
    this.intents.clear();
    this.intentsByActor.clear();
    this.intentsByState.clear();
  }

  /**
   * Export all intents (for backup/audit).
   */
  exportAll(): IntentToken[] {
    return Array.from(this.intents.values());
  }
}

// Singleton instance
const intentStore = new IntentStore();

export { intentStore, IntentStore };
