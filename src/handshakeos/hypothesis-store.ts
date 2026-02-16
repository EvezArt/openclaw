/**
 * HandshakeOS-E Hypothesis Store
 *
 * Manages parallel hypotheses (me/we/they/system models) with probabilities,
 * falsifiers, and domain signatures.
 */

import type { ActorIdentity, Hypothesis, HypothesisModelType, Falsifier } from "./types.js";

/**
 * Query options for retrieving hypotheses.
 */
export type HypothesisQuery = {
  /** Filter by model type */
  modelType?: HypothesisModelType;
  /** Filter by actor ID */
  actorId?: string;
  /** Minimum probability threshold */
  minProbability?: number;
  /** Maximum probability threshold */
  maxProbability?: number;
  /** Filter by whether any falsifiers are triggered */
  falsified?: boolean;
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
 * In-memory hypothesis store for MVP implementation.
 */
class HypothesisStore {
  private hypotheses: Map<string, Hypothesis> = new Map();
  private hypothesesByModelType: Map<HypothesisModelType, Set<string>> = new Map();
  private hypothesesByActor: Map<string, Set<string>> = new Map();

  /**
   * Store a new hypothesis.
   */
  store(hypothesis: Hypothesis): void {
    if (this.hypotheses.has(hypothesis.id)) {
      throw new Error(`Hypothesis with ID ${hypothesis.id} already exists`);
    }

    this.hypotheses.set(hypothesis.id, hypothesis);

    // Index by model type
    if (!this.hypothesesByModelType.has(hypothesis.modelType)) {
      this.hypothesesByModelType.set(hypothesis.modelType, new Set());
    }
    this.hypothesesByModelType.get(hypothesis.modelType)!.add(hypothesis.id);

    // Index by actor
    if (!this.hypothesesByActor.has(hypothesis.actor.id)) {
      this.hypothesesByActor.set(hypothesis.actor.id, new Set());
    }
    this.hypothesesByActor.get(hypothesis.actor.id)!.add(hypothesis.id);
  }

  /**
   * Update an existing hypothesis.
   */
  update(id: string, updates: Partial<Hypothesis>): Hypothesis | undefined {
    const existing = this.hypotheses.get(id);
    if (!existing) {
      return undefined;
    }

    // Remove from old model type index if changed
    if (updates.modelType && updates.modelType !== existing.modelType) {
      this.hypothesesByModelType.get(existing.modelType)?.delete(id);
      if (!this.hypothesesByModelType.has(updates.modelType)) {
        this.hypothesesByModelType.set(updates.modelType, new Set());
      }
      this.hypothesesByModelType.get(updates.modelType)!.add(id);
    }

    const updated: Hypothesis = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
      version: existing.version + 1,
    };
    this.hypotheses.set(id, updated);

    return updated;
  }

  /**
   * Retrieve a hypothesis by ID.
   */
  get(id: string): Hypothesis | undefined {
    return this.hypotheses.get(id);
  }

  /**
   * Update falsifier state.
   */
  triggerFalsifier(hypothesisId: string, falsifierIndex: number): Hypothesis | undefined {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      return undefined;
    }

    if (falsifierIndex < 0 || falsifierIndex >= hypothesis.falsifiers.length) {
      throw new Error(`Invalid falsifier index: ${falsifierIndex}`);
    }

    const updatedFalsifiers = [...hypothesis.falsifiers];
    updatedFalsifiers[falsifierIndex] = {
      ...updatedFalsifiers[falsifierIndex],
      triggered: true,
      triggeredAt: Date.now(),
    };

    return this.update(hypothesisId, { falsifiers: updatedFalsifiers });
  }

  /**
   * Add evidence event to hypothesis.
   */
  addEvidence(hypothesisId: string, eventId: string): Hypothesis | undefined {
    const hypothesis = this.hypotheses.get(hypothesisId);
    if (!hypothesis) {
      return undefined;
    }

    if (hypothesis.evidenceEventIds.includes(eventId)) {
      return hypothesis; // Already added
    }

    const updatedEvidenceIds = [...hypothesis.evidenceEventIds, eventId];
    return this.update(hypothesisId, { evidenceEventIds: updatedEvidenceIds });
  }

  /**
   * Query hypotheses based on criteria.
   */
  query(options: HypothesisQuery = {}): Hypothesis[] {
    let candidateIds: Set<string> | undefined;

    // Start with most selective index
    if (options.modelType) {
      candidateIds = this.hypothesesByModelType.get(options.modelType);
    } else if (options.actorId) {
      candidateIds = this.hypothesesByActor.get(options.actorId);
    }

    // If no index matched, use all hypotheses
    if (!candidateIds) {
      candidateIds = new Set(this.hypotheses.keys());
    }

    // Filter candidates
    let results: Hypothesis[] = [];
    for (const id of candidateIds) {
      const hypothesis = this.hypotheses.get(id);
      if (!hypothesis) {
        continue;
      }

      // Apply filters
      if (options.modelType && hypothesis.modelType !== options.modelType) {
        continue;
      }
      if (options.actorId && hypothesis.actor.id !== options.actorId) {
        continue;
      }
      if (options.minProbability !== undefined && hypothesis.probability < options.minProbability) {
        continue;
      }
      if (options.maxProbability !== undefined && hypothesis.probability > options.maxProbability) {
        continue;
      }
      if (options.falsified !== undefined) {
        const isFalsified = hypothesis.falsifiers.some((f) => f.triggered);
        if (isFalsified !== options.falsified) {
          continue;
        }
      }
      if (options.startTime && hypothesis.createdAt < options.startTime) {
        continue;
      }
      if (options.endTime && hypothesis.createdAt > options.endTime) {
        continue;
      }

      results.push(hypothesis);
    }

    // Sort by probability (highest first), then by timestamp
    results.sort((a, b) => {
      if (a.probability !== b.probability) {
        return b.probability - a.probability;
      }
      return b.createdAt - a.createdAt;
    });

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
   * Get hypotheses by model type.
   */
  getByModelType(modelType: HypothesisModelType, limit?: number): Hypothesis[] {
    return this.query({ modelType, limit });
  }

  /**
   * Get hypotheses by actor.
   */
  getByActor(actor: ActorIdentity, limit?: number): Hypothesis[] {
    return this.query({ actorId: actor.id, limit });
  }

  /**
   * Get active (non-falsified) hypotheses.
   */
  getActiveHypotheses(limit?: number): Hypothesis[] {
    return this.query({ falsified: false, limit });
  }

  /**
   * Get parallel hypotheses for all model types.
   */
  getParallelHypotheses(limit = 10): Record<HypothesisModelType, Hypothesis[]> {
    return {
      me: this.getByModelType("me", limit),
      we: this.getByModelType("we", limit),
      they: this.getByModelType("they", limit),
      system: this.getByModelType("system", limit),
    };
  }

  /**
   * Count total hypotheses.
   */
  count(): number {
    return this.hypotheses.size;
  }

  /**
   * Clear all hypotheses (for testing).
   */
  clear(): void {
    this.hypotheses.clear();
    this.hypothesesByModelType.clear();
    this.hypothesesByActor.clear();
  }

  /**
   * Export all hypotheses (for backup/audit).
   */
  exportAll(): Hypothesis[] {
    return Array.from(this.hypotheses.values());
  }
}

// Singleton instance
const hypothesisStore = new HypothesisStore();

export { hypothesisStore, HypothesisStore };
